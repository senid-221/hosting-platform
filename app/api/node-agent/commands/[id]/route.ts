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

  const updated=await prisma.runtimeCommand.update({
    where:{id},
    data:{
      status:status as "SUCCEEDED"|"FAILED",
      output:b.output!==undefined?String(b.output):undefined,
      errorMessage:b.errorMessage!==undefined?String(b.errorMessage):undefined,
      finishedAt:new Date()
    }
  });

  if(status==="SUCCEEDED"){
    await prisma.runtimeEvent.create({data:{projectId:command.projectId,serverId:server.id,type:command.autoHeal?"AUTO_HEAL_SUCCEEDED":command.type==="RESTART"?"MANUAL_RESTART":"MANUAL_STOP",message:command.autoHeal?`Automatic restart attempt ${command.attempt} succeeded.`:`Runtime ${command.type.toLowerCase()} completed.`}});
    if(command.type==="RESTART")await prisma.project.update({where:{id:command.projectId},data:{status:"RUNNING"}});
    if(command.type==="STOP")await prisma.project.update({where:{id:command.projectId},data:{status:"STOPPED",runtimeContainer:null,runtimePort:null}});
  }else{
    await prisma.runtimeEvent.create({data:{projectId:command.projectId,serverId:server.id,type:command.autoHeal?"AUTO_HEAL_FAILED":"HEALTH_FAILURE",message:command.autoHeal?`Automatic restart attempt ${command.attempt} failed.`:`Runtime command ${command.type.toLowerCase()} failed.`}});
    await prisma.project.update({where:{id:command.projectId},data:{status:"FAILED"}});
    if(command.autoHeal && command.attempt < command.maxAttempts){
      await prisma.runtimeCommand.create({
        data:{
          projectId:command.projectId,serverId:server.id,type:"RESTART",autoHeal:true,
          attempt:command.attempt+1,maxAttempts:command.maxAttempts
        }
      });
    }
  }

  return NextResponse.json({command:updated});
}