import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jsonSafe } from "@/lib/json";

export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){
  const user=await getCurrentUser(); if(!user) return NextResponse.json({error:"Unauthorized"},{status:401});
  const {id}=await params;
  const db=await prisma.hostedDatabase.findFirst({where:{id,userId:user.id}});
  if(!db) return NextResponse.json({error:"Database not found."},{status:404});
  const backups=await prisma.backup.findMany({where:{databaseId:id},orderBy:{createdAt:"desc"}});
  return NextResponse.json({backups:jsonSafe(backups)});
}

export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
  const user=await getCurrentUser(); if(!user) return NextResponse.json({error:"Unauthorized"},{status:401});
  const {id}=await params;
  const db=await prisma.hostedDatabase.findFirst({where:{id,userId:user.id}});
  if(!db) return NextResponse.json({error:"Database not found."},{status:404});
  const body=await request.json();
  const requested=Number(body.retentionDays??30);
  const retentionDays=Math.min(365,Math.max(1,Number.isFinite(requested)?requested:30));
  const backup=await prisma.backup.create({data:{databaseId:id,type:"DATABASE",status:"QUEUED",retentionDays,expiresAt:new Date(Date.now()+retentionDays*86400000)}});
  return NextResponse.json({backup:jsonSafe(backup)},{status:202});
}
