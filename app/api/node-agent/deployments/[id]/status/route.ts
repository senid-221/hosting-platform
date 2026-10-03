import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateAgent } from "@/lib/node-agent";

export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
  const server=await authenticateAgent(request);
  if(!server) return NextResponse.json({error:"Unauthorized node agent."},{status:401});
  const {id}=await params; const b=await request.json();
  const deployment=await prisma.deployment.findFirst({where:{id,serverId:server.id}});
  if(!deployment) return NextResponse.json({error:"Deployment not found for this node."},{status:404});
  const status=b.status;
  if(!["QUEUED","BUILDING","DEPLOYING","READY","FAILED","CANCELED"].includes(status)) return NextResponse.json({error:"Invalid deployment status."},{status:400});
  const updated=await prisma.deployment.update({where:{id},data:{status,heartbeatAt:new Date(),buildLog:b.buildLog!==undefined?String(b.buildLog):undefined,runtimeLog:b.runtimeLog!==undefined?String(b.runtimeLog):undefined,finishedAt:["READY","FAILED","CANCELED"].includes(status)?new Date():undefined}});
  if(status==="READY") await prisma.project.update({where:{id:deployment.projectId},data:{status:"RUNNING",runtimePort:typeof b.runtimePort==="number"?b.runtimePort:undefined,runtimeContainer:b.runtimeContainer!==undefined?String(b.runtimeContainer):undefined,publicUrl:b.publicUrl!==undefined?String(b.publicUrl):undefined}});
  if(status==="FAILED") await prisma.project.update({where:{id:deployment.projectId},data:{status:"FAILED"}});
  return NextResponse.json({deployment:updated});
}
