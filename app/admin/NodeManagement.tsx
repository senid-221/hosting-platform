"use client";

import { useState } from "react";

type Node = {
  id:string; name:string; hostname:string; region:string; active:boolean;
  status:string; health:string; cpuCores:number; memoryGb:number; storageGb:number;
  cpuUsedPercent:number; memoryUsedGb:number; storageUsedGb:number;
  lastHeartbeatAt:string|null; agentVersion:string|null;
};

const box={background:"#fff",border:"1px solid #e5e5e7",borderRadius:10,padding:22,marginTop:15} as const;
const button={border:"1px solid #ddd",background:"#fff",borderRadius:6,padding:"7px 10px",fontSize:11,cursor:"pointer"} as const;

export default function NodeManagement({initial}:{initial:Node[]}) {
  const [nodes,setNodes]=useState(initial);
  const [busy,setBusy]=useState<string|null>(null);
  const [message,setMessage]=useState("");

  async function action(id:string, action:string) {
    setBusy(id+action); setMessage("");
    try {
      const r=await fetch("/api/admin/servers/"+id,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({action})});
      const data=await r.json();
      if(!r.ok) throw new Error(data.error||"Action failed.");
      setNodes(v=>v.map(n=>n.id===id?{...n,...data.server}:n));
      setMessage("Node updated successfully.");
    } catch(e) { setMessage(e instanceof Error?e.message:"Action failed."); }
    finally { setBusy(null); }
  }

  return <section style={box}>
    <div className="section-head"><h2>Node management</h2><span>Lifecycle · capacity · agent state</span></div>
    {message&&<div style={{fontSize:12,padding:"10px 12px",background:"#f5f5f7",borderRadius:7,marginBottom:12}}>{message}</div>}
    <div style={{display:"grid",gap:10}}>
      {nodes.map(n=>{
        const mem=n.memoryGb?Math.round(n.memoryUsedGb/n.memoryGb*100):0;
        const disk=n.storageGb?Math.round(n.storageUsedGb/n.storageGb*100):0;
        const disabled=busy?.startsWith(n.id);
        return <div key={n.id} style={{border:"1px solid #eee",borderRadius:9,padding:14}}>
          <div style={{display:"flex",justifyContent:"space-between",gap:15}}>
            <div><b>{n.name}</b><small style={{display:"block",color:"#888",marginTop:4}}>{n.hostname} · {n.region}</small></div>
            <div><b style={{color:n.status==="ONLINE"&&n.health==="HEALTHY"?"#29945b":n.status==="DRAINING"?"#b54708":"#b42318"}}>{n.status}</b><small style={{display:"block",color:"#888",marginTop:4}}>{n.health} · {n.lastHeartbeatAt?new Date(n.lastHeartbeatAt).toLocaleString():"No heartbeat"}</small></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,margin:"13px 0",fontSize:11,color:"#777"}}>
            <span>CPU <b style={{color:"#333"}}>{Math.round(n.cpuUsedPercent)}%</b> / {n.cpuCores} cores</span>
            <span>RAM <b style={{color:"#333"}}>{Math.round(n.memoryUsedGb*10)/10}GB</b> / {n.memoryGb}GB ({mem}%)</span>
            <span>Storage <b style={{color:"#333"}}>{Math.round(n.storageUsedGb*10)/10}GB</b> / {n.storageGb}GB ({disk}%)</span>
            <span>Agent <b style={{color:"#333"}}>{n.agentVersion||"unknown"}</b></span>
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
            {n.status==="ONLINE"&&<button style={button} disabled={disabled} onClick={()=>action(n.id,"DRAIN")}>Drain</button>}
            {n.status==="DRAINING"&&<button style={button} disabled={disabled} onClick={()=>action(n.id,"ONLINE")}>Resume</button>}
            {n.status!=="MAINTENANCE"&&n.status!=="DRAINING"&&<button style={button} disabled={disabled} onClick={()=>action(n.id,"MAINTENANCE")}>Maintenance</button>}
            {n.status==="MAINTENANCE"&&<button style={button} disabled={disabled} onClick={()=>action(n.id,"ONLINE")}>Bring online</button>}
            {n.active&&n.status!=="OFFLINE"&&<button style={button} disabled={disabled} onClick={()=>action(n.id,"DEACTIVATE")}>Deactivate</button>}
            {!n.active&&<button style={button} disabled={disabled} onClick={()=>action(n.id,"ACTIVATE")}>Activate</button>}
          </div>
        </div>
      })}
      {!nodes.length&&<div className="empty">No nodes registered.</div>}
    </div>
  </section>
}