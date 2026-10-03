import { prisma } from "@/lib/prisma";

export async function selectDeploymentServer(){
  const staleSeconds=Number(process.env.NODE_HEARTBEAT_TIMEOUT_SECONDS??90);
  const cutoff=new Date(Date.now()-staleSeconds*1000);
  const servers=await prisma.server.findMany({
    where:{active:true,status:"ONLINE",health:{in:["HEALTHY","DEGRADED"]},lastHeartbeatAt:{gte:cutoff}},
    include:{_count:{select:{deployments:true}}},
    orderBy:[{health:"asc"},{cpuUsedPercent:"asc"},{memoryUsedGb:"asc"},{storageUsedGb:"asc"}]
  });
  const maxCpu=Number(process.env.SCHEDULER_MAX_CPU_PERCENT??85);
  const maxMemory=Number(process.env.SCHEDULER_MAX_MEMORY_PERCENT??0.85);
  const maxStorage=Number(process.env.SCHEDULER_MAX_STORAGE_PERCENT??0.85);

  return servers.find(s=>{
    const activeDeployments=s._count.deployments;
    const cpuAvailable=s.cpuUsedPercent+s.reservedCpuPercent<maxCpu;
    const memoryAvailable=s.memoryUsedGb+s.reservedMemoryGb<s.memoryGb*maxMemory;
    const storageAvailable=s.storageUsedGb+s.reservedStorageGb<s.storageGb*maxStorage;
    const concurrencyAvailable=activeDeployments<s.maxConcurrentDeployments;
    return cpuAvailable&&memoryAvailable&&storageAvailable&&concurrencyAvailable;
  })??null;
}

export async function getNodeCapacity(serverId:string){
  const server=await prisma.server.findUnique({
    where:{id:serverId},
    include:{_count:{select:{deployments:true,runtimeCommands:true}}}
  });
  if(!server)return null;
  const activeDeployments=await prisma.deployment.count({
    where:{serverId,status:{in:["QUEUED","BUILDING","DEPLOYING"]}}
  });
  return {
    maxConcurrentDeployments:server.maxConcurrentDeployments,
    activeDeployments,
    availableDeploymentSlots:Math.max(0,server.maxConcurrentDeployments-activeDeployments),
    cpuPercent:server.cpuUsedPercent,
    reservedCpuPercent:server.reservedCpuPercent,
    memoryPercent:server.memoryGb?server.memoryUsedGb/server.memoryGb*100:0,
    reservedMemoryGb:server.reservedMemoryGb,
    storagePercent:server.storageGb?server.storageUsedGb/server.storageGb*100:0,
    reservedStorageGb:server.reservedStorageGb
  };
}

export async function reconcileNodeHealth(){
  const staleSeconds=Number(process.env.NODE_HEARTBEAT_TIMEOUT_SECONDS??90);
  const cutoff=new Date(Date.now()-staleSeconds*1000);
  const stale=await prisma.server.findMany({where:{active:true,status:"ONLINE",OR:[{lastHeartbeatAt:null},{lastHeartbeatAt:{lt:cutoff}}]}});
  if(!stale.length)return {drained:0};
  await prisma.server.updateMany({where:{id:{in:stale.map(s=>s.id)}},data:{status:"DRAINING",health:"UNHEALTHY",drainReason:"AUTO_HEALTH"}});
  return {drained:stale.length,servers:stale.map(s=>s.name)};
}

export async function recoverHealthyNodes(){
  const staleSeconds=Number(process.env.NODE_HEARTBEAT_TIMEOUT_SECONDS??90);
  const cutoff=new Date(Date.now()-staleSeconds*1000);
  const recoverable=await prisma.server.findMany({where:{active:true,status:"DRAINING",drainReason:"AUTO_HEALTH",lastHeartbeatAt:{gte:cutoff},health:{in:["HEALTHY","DEGRADED"]}}});
  if(!recoverable.length)return {recovered:0};
  await prisma.server.updateMany({where:{id:{in:recoverable.map(s=>s.id)}},data:{status:"ONLINE",drainReason:"NONE"}});
  return {recovered:recoverable.length,servers:recoverable.map(s=>s.name)};
}

export async function recoverStaleDeployments(){
  const timeout=Number(process.env.DEPLOYMENT_HEARTBEAT_TIMEOUT_SECONDS??120);
  const cutoff=new Date(Date.now()-timeout*1000);
  const stale=await prisma.deployment.findMany({
    where:{status:{in:["BUILDING","DEPLOYING"]},OR:[{heartbeatAt:null},{heartbeatAt:{lt:cutoff}}]},
    include:{server:true,project:true}
  });
  let requeued=0,failed=0;
  const servers:string[]=[];
  for(const deployment of stale){
    if(deployment.retryCount>=deployment.maxRetries){
      await prisma.deployment.update({where:{id:deployment.id},data:{status:"FAILED",finishedAt:new Date(),buildLog:"Deployment worker heartbeat timed out after retry limit."} as never});
      await prisma.project.updateMany({where:{id:deployment.projectId,status:"BUILDING"},data:{status:"FAILED"}});
      failed++;
      continue;
    }
    const server=await selectDeploymentServer();
    if(!server) continue;
    const claimed=await prisma.deployment.updateMany({
      where:{id:deployment.id,status:{in:["BUILDING","DEPLOYING"]},retryCount:deployment.retryCount},
      data:{status:"QUEUED",serverId:server.id,retryCount:{increment:1},heartbeatAt:null,startedAt:null,finishedAt:null}
    });
    if(claimed.count){requeued++;servers.push(server.name);}
  }
  return {requeued,failed,servers};
}