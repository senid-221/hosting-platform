import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){
  const user=await getCurrentUser(); if(!user) return NextResponse.json({error:"Unauthorized"},{status:401});
  const {id}=await params;
  const invoice=await prisma.invoice.findFirst({where:{id,userId:user.id},include:{subscription:{include:{plan:true}},payments:true}});
  if(!invoice) return NextResponse.json({error:"Invoice not found."},{status:404});
  return NextResponse.json({invoice});
}
