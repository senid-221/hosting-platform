import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";

const exec=promisify(execFile);
const CONTROL_PLANE=process.env.CONTROL_PLANE_URL||"http://localhost:3000";
const TOKEN=process.env.NODE_AGENT_TOKEN||"";
const MEMORY=process.env.NODE_RUNTIME_MEMORY||"768m";
const CPU=process.env.NODE_RUNTIME_CPU||"1.0";
const CADDYFILE=process.env.CADDYFILE_PATH||"/etc/caddy/Caddyfile";
const CADDY_CONTAINER=process.env.CADDY_CONTAINER||"hosting-caddy";
const CADDYFILE_CONTAINER=process.env.CADDYFILE_CONTAINER_PATH||"/etc/caddy/Caddyfile";
const NETWORK=process.env.NODE_RUNTIME_NETWORK||"hosting-runtime";

async function renderProxyConfig(input:{container:string;port:number;hostname?:string;customDomains:string[];healthPath?:string}){
  await exec("docker",["network","inspect",NETWORK]).catch(()=>exec("docker",["network","create",NETWORK]));
  await exec("docker",["network","connect",NETWORK,CADDY_CONTAINER]).catch(()=>{});
  const hosts=[input.hostname,...input.customDomains].filter(Boolean).map(h=>String(h));
  if(!hosts.length) return;
  const block=`# HOSTING_PROJECT:${input.container}\n${hosts.join(" ")} {\n  reverse_proxy ${input.container}:${input.port} {\n    health_uri ${input.healthPath||"/"}\n    health_interval 10s\n    health_timeout 3s\n  }\n}\n`;
  let current=""; try{current=await readFile(CADDYFILE,"utf8");}catch{}
  const marker=`# HOSTING_PROJECT:${input.container}`;
  const pattern=new RegExp(`${marker}[\\s\\S]*?(?=\\n# HOSTING_PROJECT:|$)`,"g");
  const next=current.replace(pattern,"").trim();
  await mkdir(path.dirname(CADDYFILE),{recursive:true});
  await writeFile(CADDYFILE,(next?next+"\n\n":"")+block,"utf8");
  await exec("docker",["exec",CADDY_CONTAINER,"caddy","reload","--config",CADDYFILE]).catch(async()=>{
    await exec("docker",["exec",CADDY_CONTAINER,"caddy","reload","--config","/etc/caddy/Caddyfile"]); 
  });
}
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
  healthPath?:string;
  hostname?:string;
  publicUrl?:string;
  customDomains?:string[];
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
      "--network",NETWORK,
      "--label",`hosting.project=${job.projectId}`,
      "--label",`hosting.hostname=${job.hostname||""}`,
      image
    ]);

    await renderProxyConfig({container,port:job.port||3000,hostname:job.hostname,customDomains:job.customDomains||[],healthPath:job.healthPath});
    const inspect=await exec("docker",["inspect","-f","{{.State.Running}}",container]);
    if(inspect.stdout.trim()!=="true") throw new Error("Runtime container did not start.");

    await api(job.deploymentId,"READY",{
      buildLog:log+"Runtime started successfully.\n",
      runtimeLog:inspect.stdout.trim(),
      runtimePort:job.port||3000,
      runtimeContainer:container,
      publicUrl:job.publicUrl
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
