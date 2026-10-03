import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function GET(){
  const gate=await requireAdmin(); if(gate.response) return gate.response;
  return NextResponse.json({plans:await prisma.plan.findMany({orderBy:{monthlyPrice:"asc"}})});
}

export async function POST(request:Request){
  const gate=await requireAdmin(); if(gate.response) return gate.response;
  const b=await request.json();
  const plan=await prisma.plan.create({data:{
    name:String(b.name||"").trim(),
    monthlyPrice:Math.max(0,Number(b.monthlyPrice||0)),
    storageGb:Math.max(0,Number(b.storageGb||0)),
    bandwidthGb:Math.max(0,Number(b.bandwidthGb||0)),
    websites:Math.max(0,Number(b.websites||0)),
    databases:Math.max(0,Number(b.databases||0)),
    mailboxes:Math.max(0,Number(b.mailboxes||0))
  }});
  return NextResponse.json({plan},{status:201});
}
