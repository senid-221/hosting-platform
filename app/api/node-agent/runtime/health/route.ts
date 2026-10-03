import {NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {authenticateAgent} from "@/lib/node-agent";

const MAX_AUTO_HEAL_ATTEMPTS=Number(process.env.RUNTIME_AUTO_HEAL_MAX_ATTEMPTS||3);
const AUTO_HEAL_WINDOW_MS=Number(process.env.RUNTIME_AUTO_HEAL_WINDOW_MS||900000);

export async function GET(request:Request){
  const server=await authenticateAgent(request);
  if(!server)return NextResponse.json({error:"Unauthorized node agent."},{status:401});
  const projects=await prisma.project.findMany({
    where:{status:"RUNNING",runtimeContainer:{not:null},deployments:{some:{serverId:server.id,status:"READY"}}},
    select:{id:true,runtimeContainer:true,runtimePort:true,healthPath:true}
  });
  return NextResponse.json({projects});
}

export async function POST(request:Request){
  const server=await authenticateAgent(request);
  if(!server)return NextResponse.json({error:"Unauthorized node agent."},{status:401});
  const body=await request.json();
  const projectId=String(body.projectId||"");
  const running=Boolean(body.running);
  const project=await prisma.project.findFirst({
    where:{id:projectId,deployments:{some:{serverId:server.id,status:"READY"}}},
    select:{id:true,status:true,runtimeContainer:true,runtimePort:true,healthPath:true}
  });
  if(!project)return NextResponse.json({error:"Runtime project not found for this node."},{status:404});

  if(running){
    if(project.status==="FAILED")await prisma.project.update({where:{id:project.id},data:{status:"RUNNING"}});
    return NextResponse.json({ok:true,projectId:project.id,running:true});
  }

  await prisma.project.update({where:{id:project.id},data:{status:"FAILED"}});
  await prisma.runtimeEvent.create({data:{projectId:project.id,serverId:server.id,type:"HEALTH_FAILURE",message:"Runtime container is no longer running."}});
  const since=new Date(Date.now()-AUTO_HEAL_WINDOW_MS);
  const recent=await prisma.runtimeCommand.count({where:{projectId:project.id,serverId:server.id,autoHeal:true,createdAt:{gte:since}}});
  const active=await prisma.runtimeCommand.findFirst({where:{projectId:project.id,serverId:server.id,status:{in:["QUEUED","RUNNING"]}}});

  if(!active && recent<MAX_AUTO_HEAL_ATTEMPTS){
    await prisma.runtimeEvent.create({data:{projectId:project.id,serverId:server.id,type:"AUTO_HEAL_STARTED",message:`Automatic restart attempt ${recent+1} of ${MAX_AUTO_HEAL_ATTEMPTS}.`}});
    await prisma.runtimeCommand.create({
      data:{
        projectId:project.id,serverId:server.id,type:"RESTART",autoHeal:true,
        attempt:recent+1,maxAttempts:MAX_AUTO_HEAL_ATTEMPTS
      }
    });
  }

  return NextResponse.json({
    ok:true,projectId:project.id,running:false,
    selfHealing:{attemptsUsed:recent,attemptsRemaining:Math.max(0,MAX_AUTO_HEAL_ATTEMPTS-recent)}
  });
}