import {NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {authenticateAgent} from "@/lib/node-agent";

export async function GET(request:Request){
  const server=await authenticateAgent(request);
  if(!server)return NextResponse.json({error:"Unauthorized node agent."},{status:401});
  const command=await prisma.runtimeCommand.findFirst({
    where:{status:"QUEUED",serverId:server.id},
    include:{project:true},
    orderBy:{createdAt:"asc"}
  });
  if(!command)return new NextResponse(null,{status:204});
  const claimed=await prisma.runtimeCommand.updateMany({where:{id:command.id,status:"QUEUED",serverId:server.id},data:{status:"RUNNING",startedAt:new Date()}});
  if(!claimed.count)return new NextResponse(null,{status:204});
  return NextResponse.json({command:{id:command.id,type:command.type,projectId:command.projectId,runtimeContainer:command.project.runtimeContainer}});
}