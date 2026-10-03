import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){
  const gate=await requireAdmin(); if(gate.response) return gate.response;
  const {id}=await params; const b=await request.json(); const data:any={};
  for(const k of ["name","monthlyPrice","storageGb","bandwidthGb","websites","databases","mailboxes"]) if(b[k]!==undefined) data[k]=k==="name"?String(b[k]).trim():Math.max(0,Number(b[k]));
  const plan=await prisma.plan.update({where:{id},data});
  return NextResponse.json({plan});
}
