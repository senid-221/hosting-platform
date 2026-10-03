import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){
  const user=await getCurrentUser(); if(!user) return NextResponse.json({error:"Unauthorized"},{status:401});
  const {id}=await params;
  const backup=await prisma.backup.findFirst({where:{id,OR:[{project:{userId:user.id}},{database:{userId:user.id}}]}});
  if(!backup) return NextResponse.json({error:"Backup not found."},{status:404});
  return NextResponse.json({backup});
}
