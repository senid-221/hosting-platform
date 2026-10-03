import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function GET(){
  const gate=await requireAdmin(); if(gate.response) return gate.response;
  const servers=await prisma.server.findMany({orderBy:{createdAt:"desc"}});
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
  if(!name||!hostname||!region) return NextResponse.json({error:"name, hostname and region are required."},{status:400});
  const server=await prisma.server.create({data:{name,hostname,region,cpuCores,memoryGb,storageGb}});
  return NextResponse.json({server},{status:201});
}
