import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateAgent } from "@/lib/node-agent";

export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
  const server=await authenticateAgent(request);
  if(!server) return NextResponse.json({error:"Unauthorized node agent."},{status:401});
  const {id}=await params;
  const deployment=await prisma.deployment.findFirst({where:{id,serverId:server.id,status:"QUEUED"},include:{project:true}});
  if(!deployment) return NextResponse.json({error:"Deployment is not queued for this node."},{status:404});

  const claimed=await prisma.deployment.updateMany({
    where:{id,serverId:server.id,status:"QUEUED"},
    data:{status:"BUILDING",startedAt:new Date()}
  });
  if(claimed.count!==1) return NextResponse.json({error:"Deployment was already claimed."},{status:409});

  await prisma.project.updateMany({
    where:{id:deployment.projectId,status:{in:["DRAFT","FAILED","STOPPED","BUILDING"]}},
    data:{status:"BUILDING"}
  });

  const updated=await prisma.deployment.findUnique({where:{id}});
  return NextResponse.json({deployment:updated,project:deployment.project});
}