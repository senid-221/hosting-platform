import { reconcileNodeHealth } from "../../../lib/scheduler";

const interval=Number(process.env.NODE_HEALTH_RECONCILE_SECONDS||30)*1000;

async function run(){
  try{
    const result=await reconcileNodeHealth();
    if(result.drained) console.warn("[node-health] drained stale nodes:",result.servers?.join(", "));
  }catch(error){
    console.error("[node-health] reconciliation failed:",error);
  }
}

run();
setInterval(run,interval);
console.log(`Node health worker running every ${interval/1000}s.`);