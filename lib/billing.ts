import { prisma } from "@/lib/prisma";

export function billingCurrency(){ return process.env.BILLING_CURRENCY || "USD"; }

export async function getCurrentPeriod(){
  const now=new Date();
  const start=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),1));
  const end=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth()+1,1));
  return {start,end};
}

export async function calculateUsage(userId:string){
  const {start,end}=await getCurrentPeriod();
  const [storage, databases, websites, email] = await Promise.all([
    prisma.fileNode.aggregate({where:{project:{userId}},_sum:{sizeBytes:true}}),
    prisma.hostedDatabase.count({where:{userId}}),
    prisma.project.count({where:{userId}}),
    Promise.resolve(0)
  ]);
  const storageBytes=Number(storage._sum.sizeBytes ?? 0);
  return {
    periodStart:start, periodEnd:end,
    storageBytes, storageGb: storageBytes / (1024**3),
    bandwidthGb: 0, databases, websites, email,
    bandwidthMeasured:false
  };
}

export async function getUserPlan(userId:string){
  const subscription=await prisma.subscription.findFirst({
    where:{userId,status:{in:["TRIALING","ACTIVE","PAST_DUE"]}},
    include:{plan:true}, orderBy:{startedAt:"desc"}
  });
  return subscription;
}
