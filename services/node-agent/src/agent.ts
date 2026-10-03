import os from "node:os";
import { request } from "undici";

const CONTROL_PLANE=process.env.CONTROL_PLANE_URL||"http://localhost:3000";
const TOKEN=process.env.NODE_AGENT_TOKEN||"";
const interval=Number(process.env.NODE_AGENT_HEARTBEAT_SECONDS||30)*1000;

async function heartbeat(){
  if(!TOKEN) throw new Error("NODE_AGENT_TOKEN is required");
  const cpus=os.cpus().length||1;
  const memoryGb=os.totalmem()/1024**3;
  const freeGb=os.freemem()/1024**3;
  const response=await request(CONTROL_PLANE+"/api/node-agent/heartbeat",{
    method:"POST",
    headers:{"authorization":"Bearer "+TOKEN,"content-type":"application/json"},
    body:JSON.stringify({
      health:"HEALTHY",
      agentVersion:process.env.NODE_AGENT_VERSION||"0.1.0",
      cpuUsedPercent:0,
      memoryUsedGb:Math.max(0,memoryGb-freeGb),
      storageUsedGb:0,
      cpuCores:cpus
    })
  });
  if(response.statusCode>=300) throw new Error("Heartbeat failed: "+response.statusCode);
}

async function main(){
  await heartbeat();
  setInterval(()=>heartbeat().catch(error=>console.error(error)),interval);
  console.log("Hosting node agent is running.");
}
main().catch(error=>{console.error(error);process.exit(1)});
