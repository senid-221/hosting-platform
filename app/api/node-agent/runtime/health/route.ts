import {NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {authenticateAgent} from "@/lib/node-agent";

export async function GET(request:Request){
  const server=await authenticateAgent(request);
  if(!server)return NextResponse.json({error:"Unauthorized node agent."},{status:401});
  const projects=await prisma.project.findMany({
    where:{status:"RUNNING",runtimeContainer:{not:null},deployments:{some:{serverId:server.id,status:"READY"}}},
    select:{id: true,runtimeContainer:true,healthPath:true}
  });
  return NextResponse.json({projects});
}

export async function POST(request:Request){
  const server=await authenticateAgent(request);
  if(!server)return NextResponse.json({error:"Unauthorized node agent."},{status:401});
  const body=await request.json();
  const projectId=String(body.projectId||"");
  const running=Boolean(body.running);
  const project=await prisma.project.findFirst({where:{id:projectId,deployments:{some:{serverId:server.id,status:"READY"}}},select:{id:true,status:true,runtimeContainer:true}});
  if(!project)return NextResponse.json({error:"Runtime project not found for this node."},{status:404});
  if(running){
    if(project.status==="FAILED")await prisma.project.update({where:{id:project.id},data:{status:"RUNNING"}});
  }else{
    await prisma.project.update({where:{id:project.id},data:{status:"FAILED"}});
  }
  return NextResponse.json({ok:true,projectId:project.id,running});
}