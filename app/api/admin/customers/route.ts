import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function GET(){
  const gate=await requireAdmin(); if(gate.response) return gate.response;
  const users=await prisma.user.findMany({
    select:{id:true,email:true,name:true,role:true,createdAt:true,_count:{select:{projects:true,subscriptions:true,invoices:true}}},
    orderBy:{createdAt:"desc"}
  });
  return NextResponse.json({users});
}
