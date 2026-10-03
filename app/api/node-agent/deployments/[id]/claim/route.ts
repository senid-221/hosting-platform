import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateAgent } from "@/lib/node-agent";

export async function POST(_:Request,{params}:{params:Promise<{id:string}>}){
  const server=await authenticateAgent(_);
  if(!server) return NextResponse.json({error:"Unauthorized node agent."},{status:401});
  const {id}=await params;
  const deployment=await prisma.deployment.findFirst({where:{id,serverId:server.id,status:"QUEUED"},include:{project:true}});
  if(!deployment) return NextResponse.json({error:"Deployment is not queued for this node."},{status:404});
  const updated=await prisma.deployment.update({where:{id},data:{status:"BUILDING",startedAt:new Date()}});
  return NextResponse.json({deployment:updated,project:deployment.project});
}
