import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function GET(){
  const gate=await requireAdmin(); if(gate.response) return gate.response;
  const invoices=await prisma.invoice.findMany({
    include:{user:{select:{id:true,email:true,name:true}},subscription:{include:{plan:true}},payments:true},
    orderBy:{createdAt:"desc"}
  });
  return NextResponse.json({invoices});
}
