import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function owned(userId:string,domainId:string,recordId:string){
  return prisma.dnsRecord.findFirst({where:{id:recordId,domainId,domain:{project:{userId}}}});
}

export async function PATCH(request:Request,{params}:{params:Promise<{id:string;recordId:string}>}) {
  const user=await getCurrentUser(); if(!user) return NextResponse.json({error:"Unauthorized"},{status:401});
  const {id,recordId}=await params; const record=await owned(user.id,id,recordId);
  if(!record) return NextResponse.json({error:"Record not found."},{status:404});
  const body=await request.json();
  const updated=await prisma.dnsRecord.update({where:{id:recordId},data:{name:body.name===undefined?record.name:String(body.name),value:body.value===undefined?record.value:String(body.value),ttl:body.ttl===undefined?record.ttl:Number(body.ttl),priority:body.priority===undefined?record.priority:body.priority==null?null:Number(body.priority)}});
  return NextResponse.json({record:updated});
}

export async function DELETE(_:Request,{params}:{params:Promise<{id:string;recordId:string}>}) {
  const user=await getCurrentUser(); if(!user) return NextResponse.json({error:"Unauthorized"},{status:401});
  const {id,recordId}=await params; const record=await owned(user.id,id,recordId);
  if(!record) return NextResponse.json({error:"Record not found."},{status:404});
  await prisma.dnsRecord.delete({where:{id:recordId}});
  return NextResponse.json({ok:true});
}
