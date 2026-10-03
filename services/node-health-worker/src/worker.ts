import { reconcileNodeHealth, recoverHealthyNodes, recoverStaleDeployments } from "../../../lib/scheduler";

const interval=Number(process.env.NODE_HEALTH_RECONCILE_SECONDS||30)*1000;

async function run(){
  try{
    const result=await reconcileNodeHealth();
    const recovery=await recoverHealthyNodes();
    const deployments=await recoverStaleDeployments();
    if(result.drained) console.warn("[node-health] drained stale nodes:",result.servers?.join(", "));
    if(recovery.recovered) console.log("[node-health] recovered nodes:",recovery.servers?.join(", "));
    if(deployments.requeued||deployments.failed) console.log("[deployment-recovery] requeued:",deployments.requeued,"failed:",deployments.failed);
  }catch(error){
    console.error("[node-health] reconciliation failed:",error);
  }
}

run();
setInterval(run,interval);
console.log(`Node health worker running every ${interval/1000}s.`);