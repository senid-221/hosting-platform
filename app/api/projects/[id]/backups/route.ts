import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){
  const user=await getCurrentUser(); if(!user) return NextResponse.json({error:"Unauthorized"},{status:401});
  const {id}=await params;
  const project=await prisma.project.findFirst({where:{id,userId:user.id}});
  if(!project) return NextResponse.json({error:"Project not found."},{status:404});
  const backups=await prisma.backup.findMany({where:{projectId:id},orderBy:{createdAt:"desc"}});
  return NextResponse.json({backups});
}

export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
  const user=await getCurrentUser(); if(!user) return NextResponse.json({error:"Unauthorized"},{status:401});
  const {id}=await params;
  const project=await prisma.project.findFirst({where:{id,userId:user.id}});
  if(!project) return NextResponse.json({error:"Project not found."},{status:404});
  const body=await request.json();
  const retentionDays=Math.min(365,Math.max(1,Number(body.retentionDays??30)));
  const backup=await prisma.backup.create({data:{projectId:id,type:"PROJECT",status:"QUEUED",retentionDays,expiresAt:new Date(Date.now()+retentionDays*86400000)}});
  return NextResponse.json({backup},{status:202});
}
