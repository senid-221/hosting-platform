import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(){
  const user=await getCurrentUser(); if(!user) return NextResponse.json({error:"Unauthorized"},{status:401});
  const invoices=await prisma.invoice.findMany({where:{userId:user.id},include:{subscription:{include:{plan:true}},payments:true},orderBy:{createdAt:"desc"}});
  return NextResponse.json({invoices});
}
