import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateAgent } from "@/lib/node-agent";
import { projectHostname, projectUrl } from "@/lib/routing";

export async function GET(request:Request){
  const server=await authenticateAgent(request);
  if(!server) return NextResponse.json({error:"Unauthorized node agent."},{status:401});
  if(!server.active || server.status!=="ONLINE" || server.health==="UNHEALTHY") return new NextResponse(null,{status:204});

  const deployment=await prisma.deployment.findFirst({
    where:{serverId:server.id,status:"QUEUED"},
    include:{project:{include:{domains:true}}},
    orderBy:{createdAt:"asc"}
  });
  if(!deployment) return new NextResponse(null,{status:204});

  const claimed=await prisma.deployment.updateMany({
    where:{id:deployment.id,serverId:server.id,status:"QUEUED"},
    data:{status:"BUILDING",startedAt:new Date()}
  });
  if(!claimed.count) return new NextResponse(null,{status:204});

  return NextResponse.json({deployment:{
    deploymentId:deployment.id,
    projectId:deployment.projectId,
    repositoryUrl:deployment.project.repositoryUrl,
    repositoryBranch:deployment.project.repositoryBranch,
    commitSha:deployment.commitSha,
    port:deployment.project.port,
    healthPath:deployment.project.healthPath,
    hostname:projectHostname(deployment.project.slug),
    publicUrl:projectUrl(deployment.project.slug),
    customDomains:deployment.project.domains.filter(d=>d.verified && d.projectId===deployment.projectId).map(d=>d.name)
  }});
}
