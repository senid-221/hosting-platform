import {NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {authenticateAgent} from "@/lib/node-agent";

export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
  const server=await authenticateAgent(request);
  if(!server)return NextResponse.json({error:"Unauthorized node agent."},{status:401});
  const {id}=await params;
  const b=await request.json();
  const status=String(b.status||"");
  if(!["SUCCEEDED","FAILED"].includes(status))return NextResponse.json({error:"Invalid command status."},{status:400});
  const command=await prisma.runtimeCommand.findFirst({where:{id,serverId:server.id,status:"RUNNING"},include:{project:true}});
  if(!command)return NextResponse.json({error:"Command not found for this node."},{status:404});
  const updated=await prisma.runtimeCommand.update({where:{id},data:{status:status as "SUCCEEDED"|"FAILED",output:b.output!==undefined?String(b.output):undefined,errorMessage:b.errorMessage!==undefined?String(b.errorMessage):undefined,finishedAt:new Date()}});
  if(status==="SUCCEEDED"){
    if(command.type==="RESTART")await prisma.project.update({where:{id:command.projectId},data:{status:"RUNNING"}});
    if(command.type==="STOP")await prisma.project.update({where:{id:command.projectId},data:{status:"STOPPED",runtimeContainer:null,runtimePort:null}});
  }else{
    await prisma.project.update({where:{id:command.projectId},data:{status:"FAILED"}});
  }
  return NextResponse.json({command:updated});
}