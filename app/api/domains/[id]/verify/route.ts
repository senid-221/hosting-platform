import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_:Request,{params}:{params:Promise<{id:string}>}) {
  const user=await getCurrentUser(); if(!user) return NextResponse.json({error:"Unauthorized"},{status:401});
  const {id}=await params;
  const domain=await prisma.domain.findFirst({where:{id,project:{userId:user.id}}});
  if(!domain) return NextResponse.json({error:"Domain not found."},{status:404});
  if(!domain.verificationToken) return NextResponse.json({error:"Verification token is missing."},{status:400});

  // DNS verification provider integration is intentionally isolated here.
  // In production this should query authoritative DNS rather than trusting client input.
  const verified=process.env.DOMAIN_VERIFICATION_MODE==="development";
  if(!verified) return NextResponse.json({verified:false,verificationToken:domain.verificationToken,status:"PENDING"});

  const updated=await prisma.domain.update({where:{id},data:{verified:true}});
  return NextResponse.json({verified:true,domain:updated});
}
