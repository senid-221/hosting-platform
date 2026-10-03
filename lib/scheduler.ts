import { prisma } from "@/lib/prisma";

export async function selectDeploymentServer(){
  const servers=await prisma.server.findMany({
    where:{active:true,status:"ONLINE",health:{in:["HEALTHY","DEGRADED"]}},
    orderBy:[{health:"asc"},{cpuUsedPercent:"asc"},{memoryUsedGb:"asc"},{storageUsedGb:"asc"}]
  });
  return servers.find(s =>
    s.cpuUsedPercent < Number(process.env.SCHEDULER_MAX_CPU_PERCENT ?? 85) &&
    s.memoryUsedGb < s.memoryGb * Number(process.env.SCHEDULER_MAX_MEMORY_PERCENT ?? 0.85) &&
    s.storageUsedGb < s.storageGb * Number(process.env.SCHEDULER_MAX_STORAGE_PERCENT ?? 0.85)
  ) ?? null;
}
