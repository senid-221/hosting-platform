import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function GET(){
  const gate=await requireAdmin(); if(gate.response) return gate.response;
  const [users,projects,running,deployments,servers,subscriptions,invoices]=await Promise.all([
    prisma.user.count(),
    prisma.project.count(),
    prisma.project.count({where:{status:"RUNNING"}}),
    prisma.deployment.count({where:{status:{in:["QUEUED","BUILDING","DEPLOYING"]}}}),
    prisma.server.count(),
    prisma.subscription.count({where:{status:{in:["TRIALING","ACTIVE","PAST_DUE"]}}}),
    prisma.invoice.count({where:{status:{in:["OPEN","PAST_DUE"]}}})
  ]);
  return NextResponse.json({users,projects,running,activeDeployments:deployments,servers,activeSubscriptions:subscriptions,openInvoices:invoices});
}
