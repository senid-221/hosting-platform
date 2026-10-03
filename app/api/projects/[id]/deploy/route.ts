import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deploymentQueue } from "@/lib/queue";
import { selectDeploymentServer } from "@/lib/scheduler";

export async function POST(request: Request, {params}:{params:Promise<{id:string}>}) {
  const user=await getCurrentUser();
  if(!user) return NextResponse.json({error:"Unauthorized"},{status:401});
  const {id}=await params;
  const project=await prisma.project.findFirst({where:{id,userId:user.id}});
  if(!project) return NextResponse.json({error:"Project not found."},{status:404});

  let commitSha:string|undefined;
  try {
    const body=await request.json();
    if(body.commitSha) commitSha=String(body.commitSha);
  } catch {}

  const active=await prisma.deployment.findFirst({
    where:{projectId:project.id,status:{in:["QUEUED","BUILDING","DEPLOYING"]}},
    orderBy:{createdAt:"desc"}
  });
  if(active) return NextResponse.json({error:"A deployment is already in progress for this project.",deployment:active},{status:409});

  const server=await selectDeploymentServer();
  if(!server) return NextResponse.json({error:"No healthy deployment server currently has enough capacity."},{status:503});

  const deployment=await prisma.deployment.create({
    data:{projectId:project.id,commitSha,status:"QUEUED",serverId:server.id}
  });
  await prisma.project.update({where:{id:project.id},data:{status:"BUILDING"}});
  await deploymentQueue.add("deploy",{
    deploymentId:deployment.id,
    projectId:project.id,
    repositoryUrl:project.repositoryUrl,
    repositoryBranch:project.repositoryBranch,
    commitSha:commitSha ?? null,
    serverId:server.id,
    serverHostname:server.hostname,
  },{removeOnComplete:100,removeOnFail:1000});

  return NextResponse.json({deployment},{status:202});
}
