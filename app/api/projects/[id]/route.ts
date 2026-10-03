import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jsonSafe } from "@/lib/json";

export async function GET(_: Request, {params}:{params:Promise<{id:string}>}) {
  const user=await getCurrentUser(); if(!user) return NextResponse.json({error:"Unauthorized"},{status:401});
  const {id}=await params;
  const project=await prisma.project.findFirst({where:{id,userId:user.id},include:{deployments:{orderBy:{createdAt:"desc"},include:{server:{select:{name:true,hostname:true,region:true}}}},domains:true,environmentVariables:{select:{id:true,key:true,environment:true,createdAt:true}},backups:{orderBy:{createdAt:"desc"},take:10}}});
  if(!project) return NextResponse.json({error:"Project not found."},{status:404});
  return NextResponse.json({project:jsonSafe(project)});
}

export async function DELETE(_: Request, {params}:{params:Promise<{id:string}>}) {
  const user=await getCurrentUser(); if(!user) return NextResponse.json({error:"Unauthorized"},{status:401});
  const {id}=await params;
  const project=await prisma.project.findFirst({where:{id,userId:user.id},select:{id:true}});
  if(!project) return NextResponse.json({error:"Project not found."},{status:404});
  await prisma.project.delete({where:{id}});
  return NextResponse.json({ok:true});
}
