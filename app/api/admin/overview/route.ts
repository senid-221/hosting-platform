import {NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {requireAdmin} from "@/lib/admin";

export async function GET(){
  const gate=await requireAdmin();if(gate.response)return gate.response;
  const [users,projects,running,deployments,servers,subscriptions,invoices,failedProjects,healing,events,recentDeployments]=await Promise.all([
    prisma.user.count(),prisma.project.count(),prisma.project.count({where:{status:"RUNNING"}}),
    prisma.deployment.count({where:{status:{in:["QUEUED","BUILDING","DEPLOYING"]}}}),
    prisma.server.count(),prisma.subscription.count({where:{status:{in:["TRIALING","ACTIVE","PAST_DUE"]}}}),
    prisma.invoice.count({where:{status:{in:["OPEN","PAST_DUE"]}}}),prisma.project.count({where:{status:"FAILED"}}),
    prisma.runtimeCommand.count({where:{autoHeal:true,status:{in:["QUEUED","RUNNING"]}}}),
    prisma.runtimeEvent.findMany({orderBy:{createdAt:"desc"},take:12,include:{project:{select:{id:true,name:true}},server:{select:{name:true}}}}),
    prisma.deployment.findMany({orderBy:{createdAt:"desc"},take:10,include:{project:{select:{name:true}},server:{select:{name:true,region:true}}}})
  ]);
  return NextResponse.json({users,projects,running,activeDeployments:deployments,servers,activeSubscriptions:subscriptions,openInvoices:invoices,failedProjects,activeSelfHealing:healing,events,recentDeployments});
}