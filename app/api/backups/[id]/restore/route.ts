import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_:Request,{params}:{params:Promise<{id:string}>}){
  const user=await getCurrentUser(); if(!user) return NextResponse.json({error:"Unauthorized"},{status:401});
  const {id}=await params;
  const backup=await prisma.backup.findFirst({where:{id,OR:[{project:{userId:user.id}},{database:{userId:user.id}}]}});
  if(!backup) return NextResponse.json({error:"Backup not found."},{status:404});
  if(backup.status!=="COMPLETED") return NextResponse.json({error:"Only completed backups can be restored."},{status:409});
  const updated=await prisma.backup.update({where:{id},data:{status:"RESTORING"}});
  return NextResponse.json({backup:updated,message:"Restore queued for the isolated backup worker."},{status:202});
}
