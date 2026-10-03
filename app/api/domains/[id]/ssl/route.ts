import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_:Request,{params}:{params:Promise<{id:string}>}) {
  const user=await getCurrentUser(); if(!user) return NextResponse.json({error:"Unauthorized"},{status:401});
  const {id}=await params;
  const domain=await prisma.domain.findFirst({where:{id,project:{userId:user.id}}});
  if(!domain) return NextResponse.json({error:"Domain not found."},{status:404});
  return NextResponse.json({enabled:domain.sslEnabled,status:domain.sslStatus});
}

export async function POST(_:Request,{params}:{params:Promise<{id:string}>}) {
  const user=await getCurrentUser(); if(!user) return NextResponse.json({error:"Unauthorized"},{status:401});
  const {id}=await params;
  const domain=await prisma.domain.findFirst({where:{id,project:{userId:user.id}}});
  if(!domain) return NextResponse.json({error:"Domain not found."},{status:404});
  if(!domain.verified) return NextResponse.json({error:"Verify the domain before requesting SSL."},{status:409});
  const updated=await prisma.domain.update({where:{id},data:{sslStatus:"REQUESTED"}});
  return NextResponse.json({ssl:updated});
}
