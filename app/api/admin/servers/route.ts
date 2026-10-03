import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function GET(){
  const gate=await requireAdmin(); if(gate.response) return gate.response;
  const servers=await prisma.server.findMany({orderBy:{createdAt:"desc"},omit:{agentTokenHash:true}});
  return NextResponse.json({servers});
}

export async function POST(request:Request){
  const gate=await requireAdmin(); if(gate.response) return gate.response;
  const body=await request.json();
  const name=String(body.name||"").trim();
  const hostname=String(body.hostname||"").trim();
  const region=String(body.region||"").trim();
  const cpuCores=Math.max(1,Number(body.cpuCores||1));
  const memoryGb=Math.max(1,Number(body.memoryGb||1));
  const storageGb=Math.max(1,Number(body.storageGb||1));
  const maxConcurrentDeployments=Math.max(1,Math.floor(Number(body.maxConcurrentDeployments||4)));
  const reservedCpuPercent=Math.max(0,Number(body.reservedCpuPercent||10));
  const reservedMemoryGb=Math.max(0,Number(body.reservedMemoryGb||1));
  const reservedStorageGb=Math.max(0,Number(body.reservedStorageGb||5));
  if(!name||!hostname||!region) return NextResponse.json({error:"name, hostname and region are required."},{status:400});
  const server=await prisma.server.create({data:{name,hostname,region,cpuCores,memoryGb,storageGb,maxConcurrentDeployments,reservedCpuPercent,reservedMemoryGb,reservedStorageGb},omit:{agentTokenHash:true}});
  return NextResponse.json({server},{status:201});
}
