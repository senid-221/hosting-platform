import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const exec=promisify(execFile);
const CONTROL_PLANE=process.env.CONTROL_PLANE_URL||"http://localhost:3000";
const TOKEN=process.env.NODE_AGENT_TOKEN||"";
const MEMORY=process.env.NODE_RUNTIME_MEMORY||"768m";
const CPU=process.env.NODE_RUNTIME_CPU||"1.0";

async function api(id:string,status:string,extra:Record<string,unknown>={}){
  const response=await fetch(CONTROL_PLANE+"/api/node-agent/deployments/"+id+"/status",{
    method:"POST",
    headers:{"authorization":"Bearer "+TOKEN,"content-type":"application/json"},
    body:JSON.stringify({status,...extra})
  });
  if(!response.ok) throw new Error("Control plane status update failed: "+response.status);
}

function imageName(projectId:string){
  return "hosting-app:"+projectId.replace(/[^a-zA-Z0-9_.-]/g,"-");
}

export async function executeDeployment(job:{
  deploymentId:string;
  projectId:string;
  repositoryUrl:string;
  repositoryBranch:string;
  commitSha?:string|null;
  port?:number|null;
}){
  const dir=await mkdtemp(path.join(tmpdir(),"hosting-node-"));
  const container="hosting-runtime-"+job.projectId;
  const image=imageName(job.projectId);
  let log="";
  try{
    await api(job.deploymentId,"BUILDING",{buildLog:"Cloning repository…\n"});
    const clone=await exec("git",["clone","--depth","1","--branch",job.repositoryBranch,job.repositoryUrl,dir],{maxBuffer:20*1024*1024});
    log+=clone.stdout+clone.stderr;

    if(job.commitSha){
      await exec("git",["-C",dir,"fetch","--depth","1","origin",job.commitSha]);
      await exec("git",["-C",dir,"checkout",job.commitSha]);
    }

    await api(job.deploymentId,"BUILDING",{buildLog:log+"Building isolated image…\n"});
    const build=await exec("docker",["build","--pull","--tag",image,dir],{timeout:Number(process.env.NODE_BUILD_TIMEOUT_MS||600000),maxBuffer:20*1024*1024});
    log+=build.stdout+build.stderr;

    await exec("docker",["rm","-f",container]).catch(()=>{});
    await api(job.deploymentId,"DEPLOYING",{buildLog:log+"Starting isolated runtime…\n"});

    await exec("docker",[
      "run","-d","--name",container,
      "--memory",MEMORY,"--cpus",CPU,"--pids-limit","256",
      "--read-only","--tmpfs","/tmp:rw,noexec,nosuid,size=128m",
      "--cap-drop","ALL","--security-opt","no-new-privileges:true",
      "--network","hosting-runtime",image
    ]);

    const inspect=await exec("docker",["inspect","-f","{{.State.Running}}",container]);
    if(inspect.stdout.trim()!=="true") throw new Error("Runtime container did not start.");

    await api(job.deploymentId,"READY",{
      buildLog:log+"Runtime started successfully.\n",
      runtimeLog:inspect.stdout.trim()
    });
  }catch(error){
    const message=error instanceof Error?error.message:String(error);
    await api(job.deploymentId,"FAILED",{buildLog:(log+"\n"+message).slice(-200000)}).catch(()=>{});
    await exec("docker",["rm","-f",container]).catch(()=>{});
    throw error;
  }finally{
    await rm(dir,{recursive:true,force:true}).catch(()=>{});
  }
}
