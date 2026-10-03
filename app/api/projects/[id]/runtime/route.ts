import {NextResponse} from "next/server";
import {getCurrentUser} from "@/lib/auth";
import {prisma} from "@/lib/prisma";

export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
  const u=await getCurrentUser();
  if(!u)return NextResponse.json({error:"Unauthorized"},{status:401});
  const {id}=await params;
  const p=await prisma.project.findFirst({
    where:{id,userId:u.id},
    include:{deployments:{where:{serverId:{not:null}},orderBy:{createdAt:"desc"},take:1,select:{serverId:true}}}
  });
  if(!p)return NextResponse.json({error:"Project not found."},{status:404});
  const b=await request.json();
  const type=String(b.action||"").toUpperCase();
  if(!["RESTART","STOP"].includes(type))return NextResponse.json({error:"Unsupported runtime action."},{status:400});
  const serverId=p.deployments[0]?.serverId;
  if(!p.runtimeContainer||!serverId)return NextResponse.json({error:"No active runtime node/container."},{status:409});
  const existing=await prisma.runtimeCommand.findFirst({where:{projectId:id,status:{in:["QUEUED","RUNNING"]}}});
  if(existing)return NextResponse.json({error:"A runtime action is already in progress.",command:existing},{status:409});
  const command=await prisma.runtimeCommand.create({data:{projectId:id,serverId,type:type as "RESTART"|"STOP"}});
  await prisma.runtimeEvent.create({data:{projectId:id,serverId,type:type==="RESTART"?"MANUAL_RESTART":"MANUAL_STOP",message:`Manual runtime ${type.toLowerCase()} requested.`}});
  return NextResponse.json({command},{status:202});
}

export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){
  const u=await getCurrentUser();
  if(!u)return NextResponse.json({error:"Unauthorized"},{status:401});
  const {id}=await params;
  const p=await prisma.project.findFirst({where:{id,userId:u.id},select:{id:true}});
  if(!p)return NextResponse.json({error:"Project not found."},{status:404});
  const [commands,events]=await Promise.all([prisma.runtimeCommand.findMany({where:{projectId:id},orderBy:{createdAt:"desc"},take:20,include:{server:{select:{name:true,hostname:true}}}}),prisma.runtimeEvent.findMany({where:{projectId:id},orderBy:{createdAt:"desc"},take:30,include:{server:{select:{name:true,hostname:true}}}})]);
  return NextResponse.json({commands,events});
}