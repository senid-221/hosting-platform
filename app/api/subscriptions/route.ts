import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(){
  const user=await getCurrentUser(); if(!user) return NextResponse.json({error:"Unauthorized"},{status:401});
  const subscriptions=await prisma.subscription.findMany({where:{userId:user.id},include:{plan:true},orderBy:{startedAt:"desc"}});
  return NextResponse.json({subscriptions});
}

export async function POST(request:Request){
  const user=await getCurrentUser(); if(!user) return NextResponse.json({error:"Unauthorized"},{status:401});
  const body=await request.json();
  const planId=String(body.planId||"");
  if(!planId) return NextResponse.json({error:"planId is required."},{status:400});
  const plan=await prisma.plan.findUnique({where:{id:planId}});
  if(!plan) return NextResponse.json({error:"Plan not found."},{status:404});
  await prisma.subscription.updateMany({where:{userId:user.id,status:{in:["TRIALING","ACTIVE"]}},data:{status:"CANCELED"}});
  const renewsAt=new Date(); renewsAt.setUTCMonth(renewsAt.getUTCMonth()+1);
  const subscription=await prisma.subscription.create({data:{userId:user.id,planId,status:"ACTIVE",renewsAt}});
  const number="INV-"+Date.now().toString(36).toUpperCase();
  const invoice=await prisma.invoice.create({data:{number,userId:user.id,subscriptionId:subscription.id,amount:plan.monthlyPrice,currency:process.env.BILLING_CURRENCY||"USD",status:"OPEN",dueAt:new Date()}});
  return NextResponse.json({subscription,invoice},{status:201});
}
