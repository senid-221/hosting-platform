import { prisma } from "@/lib/prisma";

export async function selectDeploymentServer(){
  const staleSeconds=Number(process.env.NODE_HEARTBEAT_TIMEOUT_SECONDS??90);
  const cutoff=new Date(Date.now()-staleSeconds*1000);
  const servers=await prisma.server.findMany({
    where:{
      active:true,status:"ONLINE",health:{in:["HEALTHY","DEGRADED"]},
      lastHeartbeatAt:{gte:cutoff}
    },
    orderBy:[{health:"asc"},{cpuUsedPercent:"asc"},{memoryUsedGb:"asc"},{storageUsedGb:"asc"}]
  });
  return servers.find(s =>
    s.cpuUsedPercent < Number(process.env.SCHEDULER_MAX_CPU_PERCENT ?? 85) &&
    s.memoryUsedGb < s.memoryGb * Number(process.env.SCHEDULER_MAX_MEMORY_PERCENT ?? 0.85) &&
    s.storageUsedGb < s.storageGb * Number(process.env.SCHEDULER_MAX_STORAGE_PERCENT ?? 0.85)
  ) ?? null;
}

export async function reconcileNodeHealth(){
  const staleSeconds=Number(process.env.NODE_HEARTBEAT_TIMEOUT_SECONDS??90);
  const cutoff=new Date(Date.now()-staleSeconds*1000);
  const stale=await prisma.server.findMany({
    where:{active:true,status:"ONLINE",OR:[{lastHeartbeatAt:null},{lastHeartbeatAt:{lt:cutoff}}]}
  });
  if(!stale.length)return {drained:0};
  await prisma.server.updateMany({
    where:{id:{in:stale.map(s=>s.id)}},
    data:{status:"DRAINING",health:"UNHEALTHY",drainReason:"AUTO_HEALTH"}
  });
  return {drained:stale.length,servers:stale.map(s=>s.name)};
}

export async function recoverHealthyNodes(){
  const staleSeconds=Number(process.env.NODE_HEARTBEAT_TIMEOUT_SECONDS??90);
  const cutoff=new Date(Date.now()-staleSeconds*1000);
  const recoverable=await prisma.server.findMany({
    where:{active:true,status:"DRAINING",drainReason:"AUTO_HEALTH",lastHeartbeatAt:{gte:cutoff},health:{in:["HEALTHY","DEGRADED"]}}
  });
  if(!recoverable.length)return {recovered:0};
  await prisma.server.updateMany({
    where:{id:{in:recoverable.map(s=>s.id)}},
    data:{status:"ONLINE",drainReason:"NONE"}
  });
  return {recovered:recoverable.length,servers:recoverable.map(s=>s.name)};
}