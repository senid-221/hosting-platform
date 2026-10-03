import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_:Request,{params}:{params:Promise<{id:string}>}) {
  const user=await getCurrentUser(); if(!user) return NextResponse.json({error:"Unauthorized"},{status:401});
  const {id}=await params;
  const domain=await prisma.domain.findFirst({where:{id,userId:user.id},include:{records:true}});
  if(!domain) return NextResponse.json({error:"Domain not found."},{status:404});
  return NextResponse.json({records:domain.records});
}

export async function POST(request:Request,{params}:{params:Promise<{id:string}>}) {
  const user=await getCurrentUser(); if(!user) return NextResponse.json({error:"Unauthorized"},{status:401});
  const {id}=await params;
  const domain=await prisma.domain.findFirst({where:{id,userId:user.id}});
  if(!domain) return NextResponse.json({error:"Domain not found."},{status:404});
  const body=await request.json();
  const type=String(body.type??"").toUpperCase();
  if(!["A","AAAA","CNAME","TXT","MX","NS"].includes(type)) return NextResponse.json({error:"Unsupported DNS record type."},{status:400});
  const value=String(body.value??"").trim();
  const name=String(body.name??"@").trim();
  if(!value) return NextResponse.json({error:"Record value is required."},{status:400});
  const record=await prisma.dnsRecord.create({data:{domainId:id,type:type as never,name,value,ttl:Number(body.ttl??3600),priority:body.priority==null?null:Number(body.priority)}});
  return NextResponse.json({record},{status:201});
}
