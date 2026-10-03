import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function GET(){
  const gate=await requireAdmin(); if(gate.response) return gate.response;
  const subscriptions=await prisma.subscription.findMany({
    include:{user:{select:{id:true,email:true,name:true}},plan:true},
    orderBy:{startedAt:"desc"}
  });
  return NextResponse.json({subscriptions});
}
