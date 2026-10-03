export function retentionExpiry(days:number){
  const safe=Math.min(3650,Math.max(1,days));
  return new Date(Date.now()+safe*86400000);
}

export function canRestore(status:string){
  return status==="COMPLETED";
}
