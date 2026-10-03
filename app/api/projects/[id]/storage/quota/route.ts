import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){
  const user=await getCurrentUser();
  if(!user) return NextResponse.json({error:"Unauthorized"},{status:401});
  const {id}=await params;
  const project=await prisma.project.findFirst({where:{id,userId:user.id}});
  if(!project) return NextResponse.json({error:"Project not found."},{status:404});
  const result=await prisma.fileNode.aggregate({where:{projectId:id},_sum:{sizeBytes:true}});
  const usedBytes=Number(result._sum.sizeBytes??0);
  const limitGb=Number(process.env.DEFAULT_STORAGE_GB??10);
  return NextResponse.json({usedBytes,limitBytes:limitGb*1024*1024*1024,limitGb});
}
