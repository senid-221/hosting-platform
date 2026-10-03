import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateAgent } from "@/lib/node-agent";

export async function POST(request:Request){
  const server=await authenticateAgent(request);
  if(!server) return NextResponse.json({error:"Unauthorized node agent."},{status:401});
  const b=await request.json();
  const updated=await prisma.server.update({where:{id:server.id},data:{
    lastHeartbeatAt:new Date(),
    health:b.health||"HEALTHY",
    status:"ONLINE",
    cpuUsedPercent:Math.max(0,Number(b.cpuUsedPercent||0)),
    memoryUsedGb:Math.max(0,Number(b.memoryUsedGb||0)),
    storageUsedGb:Math.max(0,Number(b.storageUsedGb||0)),
    agentVersion:b.agentVersion?String(b.agentVersion):server.agentVersion
  }});
  return NextResponse.json({ok:true,server:updated});
}
