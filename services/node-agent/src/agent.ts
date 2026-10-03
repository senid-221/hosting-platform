import os from "node:os";
import { execFileSync } from "node:child_process";
import { statfsSync } from "node:fs";
import { executeDeployment } from "./executor";

const CONTROL_PLANE=process.env.CONTROL_PLANE_URL||"http://localhost:3000";
const TOKEN=process.env.NODE_AGENT_TOKEN||"";
const interval=Number(process.env.NODE_AGENT_HEARTBEAT_SECONDS||30)*1000;
const pollInterval=Number(process.env.NODE_AGENT_POLL_SECONDS||5)*1000;
const healthInterval=Number(process.env.NODE_AGENT_HEALTH_SECONDS||15)*1000;
const diskRoot=process.env.NODE_AGENT_DISK_PATH||"/";
const cpuCount=Math.max(1,os.cpus().length);
const runtimeFailureThreshold=Number(process.env.NODE_RUNTIME_HEALTH_FAILURES||3);
const runtimeGraceMs=Number(process.env.NODE_RUNTIME_HEALTH_GRACE_SECONDS||30)*1000;
const runtimeFailures=new Map<string,number>();

async function request(path:string,init:RequestInit={}){
  return fetch(CONTROL_PLANE+path,{...init,headers:{authorization:"Bearer "+TOKEN,"content-type":"application/json",...(init.headers||{})}});
}

async function heartbeat(){
  const total=os.totalmem()/1024**3;
  const free=os.freemem()/1024**3;
  const load=os.loadavg()[0];
  const cpuUsedPercent=Math.min(100,Math.max(0,(load/cpuCount)*100));
  let storageUsedGb=0;
  try{
    const fs=statfsSync(diskRoot);
    const totalBytes=Number(fs.blocks)*Number(fs.bsize);
    const freeBytes=Number(fs.bfree)*Number(fs.bsize);
    storageUsedGb=Math.max(0,(totalBytes-freeBytes)/1024**3);
  }catch{}
  const memoryUsedGb=Math.max(0,total-free);
  const cpuLimit=Number(process.env.NODE_AGENT_DEGRADED_CPU_PERCENT||85);
  const memoryLimit=Number(process.env.NODE_AGENT_DEGRADED_MEMORY_PERCENT||90);
  const health=cpuUsedPercent>=cpuLimit||memoryUsedGb>=total*(memoryLimit/100)?"DEGRADED":"HEALTHY";
  const response=await request("/api/node-agent/heartbeat",{method:"POST",body:JSON.stringify({
    health,agentVersion:process.env.NODE_AGENT_VERSION||"0.4.0",
    cpuUsedPercent,memoryUsedGb,storageUsedGb
  })});
  if(!response.ok) throw new Error("Heartbeat failed: "+response.status);
}

async function commandPoll(){
  const response=await request("/api/node-agent/commands/next");
  if(response.status===204)return;
  if(!response.ok)throw new Error("Command poll failed: "+response.status);
  const body=await response.json();
  const command=body.command;
  if(!command)return;
  try{
    const action=command.type==="RESTART"?"restart":"stop";
    const output=execFileSync("docker",["container",action,command.runtimeContainer],{encoding:"utf8"});
    await request("/api/node-agent/commands/"+command.id,{method:"POST",body:JSON.stringify({status:"SUCCEEDED",output:String(output||"")})});
  }catch(error){
    await request("/api/node-agent/commands/"+command.id,{method:"POST",body:JSON.stringify({status:"FAILED",errorMessage:error instanceof Error?error.message:String(error)})}).catch(()=>{});
  }
}

async function runtimeHealthPoll(){
  const response=await request("/api/node-agent/runtime/health");
  if(response.status===204)return;
  if(!response.ok)throw new Error("Runtime health poll failed: "+response.status);
  const body=await response.json();
  for(const project of body.projects||[]){
    let running=false;
    let healthy=false;
    let withinGrace=false;
    try{
      const raw=execFileSync("docker",["inspect",project.runtimeContainer],{encoding:"utf8"});
      const info=JSON.parse(raw)[0];
      running=info?.State?.Running===true;
      const startedAt=info?.State?.StartedAt?Date.parse(info.State.StartedAt):0;
      withinGrace=startedAt>0 && Date.now()-startedAt<runtimeGraceMs;
      if(running && !withinGrace && project.runtimePort){
        const networks=info?.NetworkSettings?.Networks||{};
        const address=Object.values(networks).map((n:any)=>n?.IPAddress).find(Boolean);
        if(address){
          const controller=new AbortController();
          const timer=setTimeout(()=>controller.abort(),3000);
          try{
            const response=await fetch("http://"+address+":"+project.runtimePort+(project.healthPath||"/"),{signal:controller.signal,redirect:"manual"});
            healthy=response.status>=200&&response.status<400;
          }finally{clearTimeout(timer);}
        }
      }else if(running){
        healthy=true;
      }
    }catch{}
    if(healthy){
      runtimeFailures.delete(project.id);
    }else if(!withinGrace){
      runtimeFailures.set(project.id,(runtimeFailures.get(project.id)||0)+1);
    }
    const confirmedFailure=!withinGrace && (!running || (runtimeFailures.get(project.id)||0)>=runtimeFailureThreshold);
    await request("/api/node-agent/runtime/health",{method:"POST",body:JSON.stringify({projectId:project.id,running:!confirmedFailure})}).catch(()=>{});
  }
}

async function poll(){
  const response=await request("/api/node-agent/deployments/next");
  if(response.status===204)return;
  if(!response.ok) throw new Error("Deployment poll failed: "+response.status);
  const body=await response.json();
  if(body.deployment) await executeDeployment(body.deployment);
}

async function main(){
  if(!TOKEN) throw new Error("NODE_AGENT_TOKEN is required");
  await heartbeat();
  await runtimeHealthPoll().catch(console.error);
  setInterval(()=>heartbeat().catch(console.error),interval);
  setInterval(()=>poll().catch(console.error),pollInterval);
  setInterval(()=>commandPoll().catch(console.error),pollInterval);
  setInterval(()=>runtimeHealthPoll().catch(console.error),healthInterval);
  console.log("Hosting node agent with deployment execution and runtime health monitoring is running.");
}
main().catch(error=>{console.error(error);process.exit(1)});
