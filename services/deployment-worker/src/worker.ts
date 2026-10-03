import { Worker, Job } from "bullmq";
import IORedis from "ioredis";
import { PrismaClient } from "@prisma/client";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const exec = promisify(execFile);
const prisma = new PrismaClient();
const connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

const WORK_ROOT = process.env.DEPLOY_WORK_ROOT ?? "/var/lib/hosting-builds";
const MEMORY = process.env.DEPLOY_MEMORY ?? "768m";
const CPU = process.env.DEPLOY_CPU ?? "1.0";
const BUILD_TIMEOUT = Number(process.env.DEPLOY_BUILD_TIMEOUT_MS ?? 10 * 60 * 1000);

function safeImage(id:string) {
  return `hosting-app:${id.replace(/[^a-zA-Z0-9_.-]/g,"-")}`;
}

async function run(command:string,args:string[],timeout=BUILD_TIMEOUT) {
  return exec(command,args,{timeout,maxBuffer:20*1024*1024});
}

async function update(id:string,data:Record<string,unknown>) {
  await prisma.deployment.update({where:{id},data});
}

async function processDeployment(job:Job) {
  const {deploymentId,projectId,repositoryUrl,repositoryBranch,commitSha,serverId}=job.data as {
    deploymentId:string; projectId:string; repositoryUrl:string|null; repositoryBranch:string; commitSha:string|null; serverId:string|null;
  };

  if (!repositoryUrl) throw new Error("A Git repository is required before deployment.");
  if (serverId) {
    const server=await prisma.server.findUnique({where:{id:serverId}});
    if (!server || !server.active || server.status==="DRAINING" || server.status==="MAINTENANCE" || server.health==="UNHEALTHY") throw new Error("Assigned deployment server is no longer available.");
  }

  const dir = await mkdtemp(path.join(tmpdir(),"hosting-build-"));
  const image=safeImage(projectId);
  const container=`hosting-runtime-${projectId}`;
  let log="";

  try {
    await update(deploymentId,{status:"BUILDING",startedAt:new Date(),buildLog:"Cloning repository…\n"});
    const clone = await run("git",["clone","--depth","1","--branch",repositoryBranch,repositoryUrl,dir]);
    log += clone.stdout + clone.stderr;

    if (commitSha) {
      await run("git",["-C",dir,"fetch","--depth","1","origin",commitSha]);
      await run("git",["-C",dir,"checkout",commitSha]);
    }

    await update(deploymentId,{buildLog:log+"Building isolated image…\n"});
    await run("docker",["build","--pull","--tag",image,dir],BUILD_TIMEOUT);

    await update(deploymentId,{status:"DEPLOYING",buildLog:log+"Image built successfully. Starting runtime…\n"});
    await run("docker",["rm","-f",container]).catch(()=>{});

    await run("docker",[
      "run","-d",
      "--name",container,
      "--memory",MEMORY,
      "--cpus",CPU,
      "--pids-limit","256",
      "--read-only",
      "--tmpfs","/tmp:rw,noexec,nosuid,size=128m",
      "--cap-drop","ALL",
      "--security-opt","no-new-privileges:true",
      "--network","hosting-runtime",
      image
    ]);

    const inspect=await run("docker",["inspect","-f","{{.State.Running}}",container]);
    if (inspect.stdout.trim()!=="true") throw new Error("Runtime container failed to start.");

    await update(deploymentId,{
      status:"READY",
      buildLog:log+"Runtime started successfully.\n",
      runtimeLog:inspect.stdout.trim(),
      finishedAt:new Date()
    });
    await prisma.project.update({where:{id:projectId},data:{status:"RUNNING"}});
  } catch(error) {
    const message=error instanceof Error?error.message:String(error);
    await update(deploymentId,{status:"FAILED",buildLog:(log+"\n"+message).slice(-200000),finishedAt:new Date()});
    await prisma.project.update({where:{id:projectId},data:{status:"FAILED"}});
    await run("docker",["rm","-f",container]).catch(()=>{});
    throw error;
  } finally {
    await rm(dir,{recursive:true,force:true}).catch(()=>{});
  }
}

const worker=new Worker("deployments",processDeployment,{connection,concurrency:Number(process.env.DEPLOY_CONCURRENCY??2)});
worker.on("completed",job=>console.log(`deployment ${job.id} completed`));
worker.on("failed",(job,error)=>console.error(`deployment ${job?.id} failed:`,error));
process.on("SIGTERM",async()=>{await worker.close();await prisma.$disconnect();await connection.quit();process.exit(0)});
process.on("SIGINT",async()=>{await worker.close();await prisma.$disconnect();await connection.quit();process.exit(0)});

console.log("Hosting deployment worker is running.");
