import {redirect} from "next/navigation";
import {getCurrentUser} from "@/lib/auth";
import {prisma} from "@/lib/prisma";
import NodeManagement from "./NodeManagement";

export default async function Admin(){
  const user=await getCurrentUser();if(!user)redirect("/login");if(user.role!=="ADMIN")redirect("/dashboard");
  const [customers,websites,runningApps,deploymentCount,servers,events,recentDeployments,failedProjects,activeSelfHealing]=await Promise.all([
    prisma.user.count({where:{role:"CUSTOMER"}}),prisma.project.count(),prisma.project.count({where:{status:"RUNNING"}}),prisma.deployment.count(),
    prisma.server.findMany({orderBy:{createdAt:"desc"}}),
    prisma.runtimeEvent.findMany({orderBy:{createdAt:"desc"},take:12,include:{project:{select:{name:true}},server:{select:{name:true}}}}),
    prisma.deployment.findMany({orderBy:{createdAt:"desc"},take:8,include:{project:{select:{name:true}},server:{select:{name:true,region:true}}}}),
    prisma.project.count({where:{status:"FAILED"}}),
    prisma.runtimeCommand.count({where:{autoHeal:true,status:{in:["QUEUED","RUNNING"]}}})
  ]);
  const stats=[["Customers",customers],["Websites",websites],["Running apps",runningApps],["Deployments",deploymentCount]];
  const online=servers.filter(s=>s.status==="ONLINE"&&s.health==="HEALTHY").length;
  const unhealthy=servers.filter(s=>s.health==="UNHEALTHY"||s.status==="OFFLINE").length;
  return <main className="admin">
    <header><div className="brand"><span className="brand-mark">H</span><span>Hosting Platform Admin</span></div><span>Infrastructure: <b className={unhealthy?"warn":"ok"}>{unhealthy?unhealthy+" issue"+(unhealthy>1?"s":""):"Operational"}</b></span></header>
    <div className="admin-main"><p className="eyebrow">ADMINISTRATION</p><h1>Infrastructure center</h1>
      <div className="stats">{stats.map(([a,b])=><div className="stat" key={String(a)}><span>{String(a)}</span><strong>{String(b)}</strong></div>)}</div>
      <div className="mini-grid"><div><span>Healthy nodes</span><b>{online}/{servers.length}</b></div><div><span>Failed projects</span><b>{failedProjects}</b></div><div><span>Auto-healing active</span><b>{activeSelfHealing}</b></div></div>
      <NodeManagement initial={servers.map(s=>({
        id:s.id,name:s.name,hostname:s.hostname,region:s.region,active:s.active,status:s.status,health:s.health,drainReason:s.drainReason,
        cpuCores:s.cpuCores,memoryGb:s.memoryGb,storageGb:s.storageGb,cpuUsedPercent:s.cpuUsedPercent,
        memoryUsedGb:s.memoryUsedGb,storageUsedGb:s.storageUsedGb,lastHeartbeatAt:s.lastHeartbeatAt?.toISOString()??null,
        agentVersion:s.agentVersion
      }))} />
      <div className="admin-grid">
        <section><div className="section-head"><h2>Infrastructure</h2><span>{servers.length} nodes</span></div><div className="table"><div className="thead"><span>Server</span><span>Region</span><span>Resources</span><span>Health</span></div>
          {servers.map(s=><div className="tr" key={s.id}><span><b>{s.name}</b><small>{s.hostname}</small></span><span>{s.region}</span><span>CPU {Math.round(s.cpuUsedPercent)}% · RAM {s.memoryUsedGb.toFixed(1)}/{s.memoryGb} GB</span><span className={s.health==="HEALTHY"?"good":"bad"}>{s.health}<small>{s.lastHeartbeatAt?new Date(s.lastHeartbeatAt).toLocaleTimeString():"No heartbeat"}</small></span></div>)}
          {!servers.length&&<div className="empty">No infrastructure nodes registered.</div>}
        </div></section>
        <section><div className="section-head"><h2>Runtime activity</h2><span>Latest 12</span></div><div className="activity">
          {events.map(e=><div className="event" key={e.id}><b>{e.type.replaceAll("_"," ")}</b><span>{e.project?.name||"Project"} · {e.server?.name||"node"}</span><small>{e.message}</small><time>{new Date(e.createdAt).toLocaleString()}</time></div>)}
          {!events.length&&<div className="empty">No runtime events.</div>}
        </div></section>
      </div>
      <section className="wide"><div className="section-head"><h2>Recent deployments</h2><span>Latest 8</span></div><div className="table"><div className="thead"><span>Project</span><span>Server</span><span>Status</span><span>Created</span></div>
        {recentDeployments.map(d=><div className="tr" key={d.id}><span><b>{d.project.name}</b></span><span>{d.server?.name||"Unassigned"} <small>{d.server?.region||""}</small></span><span className={d.status==="READY"?"good":d.status==="FAILED"?"bad":""}>{d.status}</span><span>{new Date(d.createdAt).toLocaleString()}</span></div>)}
      </div></section>
    </div>
  </main>
}