import os from "node:os";
import { executeDeployment } from "./executor";

const CONTROL_PLANE=process.env.CONTROL_PLANE_URL||"http://localhost:3000";
const TOKEN=process.env.NODE_AGENT_TOKEN||"";
const interval=Number(process.env.NODE_AGENT_HEARTBEAT_SECONDS||30)*1000;
const pollInterval=Number(process.env.NODE_AGENT_POLL_SECONDS||5)*1000;

async function request(path:string,init:RequestInit={}){
  return fetch(CONTROL_PLANE+path,{...init,headers:{authorization:"Bearer "+TOKEN,"content-type":"application/json",...(init.headers||{})}});
}

async function heartbeat(){
  const total=os.totalmem()/1024**3;
  const free=os.freemem()/1024**3;
  const response=await request("/api/node-agent/heartbeat",{method:"POST",body:JSON.stringify({
    health:"HEALTHY",agentVersion:process.env.NODE_AGENT_VERSION||"0.2.0",
    cpuUsedPercent:0,memoryUsedGb:Math.max(0,total-free),storageUsedGb:0
  })});
  if(!response.ok) throw new Error("Heartbeat failed: "+response.status);
}

async function poll(){
  const response=await request("/api/node-agent/deployments/next");
  if(response.status===204) return;
  if(!response.ok) throw new Error("Deployment poll failed: "+response.status);
  const body=await response.json();
  if(body.deployment) await executeDeployment(body.deployment);
}

async function main(){
  if(!TOKEN) throw new Error("NODE_AGENT_TOKEN is required");
  await heartbeat();
  setInterval(()=>heartbeat().catch(console.error),interval);
  setInterval(()=>poll().catch(console.error),pollInterval);
  console.log("Hosting node agent with deployment execution is running.");
}
main().catch(error=>{console.error(error);process.exit(1)});
