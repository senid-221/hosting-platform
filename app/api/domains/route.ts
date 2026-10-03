import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createVerificationToken, isValidDomain, normalizeDomain } from "@/lib/domain";

export async function GET() {
  const user=await getCurrentUser(); if(!user) return NextResponse.json({error:"Unauthorized"},{status:401});
  const domains=await prisma.domain.findMany({where:{userId:user.id},include:{project:true,records:true},orderBy:{createdAt:"desc"}});
  return NextResponse.json({domains});
}

export async function POST(request:Request) {
  const user=await getCurrentUser(); if(!user) return NextResponse.json({error:"Unauthorized"},{status:401});
  const body=await request.json();
  const name=normalizeDomain(String(body.name??""));
  if(!isValidDomain(name)) return NextResponse.json({error:"Enter a valid domain name."},{status:400});
  const exists=await prisma.domain.findUnique({where:{name}});
  if(exists) return NextResponse.json({error:"Domain already exists."},{status:409});
  const projectId=body.projectId?String(body.projectId):undefined;
  if(projectId){
    const project=await prisma.project.findFirst({where:{id:projectId,userId:user.id}});
    if(!project) return NextResponse.json({error:"Project not found."},{status:404});
  }
  const domain=await prisma.domain.create({data:{name,userId:user.id,projectId,verificationToken:createVerificationToken()}});
  return NextResponse.json({domain},{status:201});
}
