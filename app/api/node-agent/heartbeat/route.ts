import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateAgent } from "@/lib/node-agent";

const healthValues=["UNKNOWN","HEALTHY","DEGRADED","UNHEALTHY"] as const;

export async function POST(request:Request){
  const server=await authenticateAgent(request);
  if(!server) return NextResponse.json({error:"Unauthorized node agent."},{status:401});
  const b=await request.json();
  const cpu=Math.max(0,Math.min(100,Number(b.cpuUsedPercent||0)));
  const memory=Math.max(0,Number(b.memoryUsedGb||0));
  const storage=Math.max(0,Number(b.storageUsedGb||0));
  const requested=String(b.health||"HEALTHY");
  const health=healthValues.includes(requested as typeof healthValues[number])?requested:"UNKNOWN";
  const memoryPct=server.memoryGb?memory/server.memoryGb*100:0;
  const storagePct=server.storageGb?storage/server.storageGb*100:0;
  const degradedCpu=Number(process.env.NODE_DEGRADED_CPU_PERCENT||85);
  const degradedMemory=Number(process.env.NODE_DEGRADED_MEMORY_PERCENT||85);
  const degradedStorage=Number(process.env.NODE_DEGRADED_STORAGE_PERCENT||85);
  const computedHealth=cpu>=100||memoryPct>=100||storagePct>=100?"UNHEALTHY":
    cpu>=degradedCpu||memoryPct>=degradedMemory||storagePct>=degradedStorage?"DEGRADED":health;

  const updated=await prisma.server.update({where:{id:server.id},data:{
    lastHeartbeatAt:new Date(),
    health:computedHealth,
    cpuUsedPercent:cpu,memoryUsedGb:memory,storageUsedGb:storage,
    agentVersion:b.agentVersion?String(b.agentVersion):server.agentVersion
  }});
  return NextResponse.json({ok:true,server:updated});
}