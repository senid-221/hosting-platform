import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateUsage, getUserPlan } from "@/lib/billing";

export async function GET(){
  const user=await getCurrentUser(); if(!user) return NextResponse.json({error:"Unauthorized"},{status:401});
  const [usage,subscription]=await Promise.all([calculateUsage(user.id),getUserPlan(user.id)]);
  const plan=subscription?.plan||null;
  return NextResponse.json({
    usage,
    plan,
    limits: plan ? {
      storageGb:plan.storageGb, bandwidthGb:plan.bandwidthGb,
      databases:plan.databases, websites:plan.websites, mailboxes:plan.mailboxes
    } : null
  });
}
