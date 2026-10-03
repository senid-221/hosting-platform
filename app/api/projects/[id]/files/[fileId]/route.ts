import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function owned(userId:string,projectId:string,fileId:string){
  return prisma.fileNode.findFirst({where:{id:fileId,projectId,project:{userId}}});
}

export async function PATCH(request:Request,{params}:{params:Promise<{id:string;fileId:string}>}){
  const user=await getCurrentUser();
  if(!user) return NextResponse.json({error:"Unauthorized"},{status:401});
  const {id,fileId}=await params;
  const file=await owned(user.id,id,fileId);
  if(!file) return NextResponse.json({error:"File not found."},{status:404});
  const body=await request.json();
  const next=String(body.path || file.path);
  if(!next.startsWith("/") || next.includes("..")) return NextResponse.json({error:"Invalid file path."},{status:400});
  const updated=await prisma.fileNode.update({where:{id:fileId},data:{path:next}});
  return NextResponse.json({file:updated});
}

export async function DELETE(_:Request,{params}:{params:Promise<{id:string;fileId:string}>}){
  const user=await getCurrentUser();
  if(!user) return NextResponse.json({error:"Unauthorized"},{status:401});
  const {id,fileId}=await params;
  const file=await owned(user.id,id,fileId);
  if(!file) return NextResponse.json({error:"File not found."},{status:404});
  await prisma.fileNode.delete({where:{id:fileId}});
  return NextResponse.json({ok:true});
}
