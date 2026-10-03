import {redirect} from "next/navigation";
import {getCurrentUser} from "@/lib/auth";
import {prisma} from "@/lib/prisma";

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
    <style jsx>{`
.admin{min-height:100vh;background:#f7f7f8;color:#222}.admin header{height:68px;background:#fff;border-bottom:1px solid #e8e8e8;padding:0 34px;display:flex;align-items:center;justify-content:space-between;font-size:12px;color:#777}.brand{display:flex;gap:10px;align-items:center;font-weight:750;color:#222}.brand-mark{display:grid;place-items:center;width:30px;height:30px;border-radius:8px;background:#673de6;color:#fff}.ok{color:#29945b}.warn{color:#b54708}.admin-main{padding:42px;max-width:1400px;margin:auto}.eyebrow{font-size:11px;color:#673de6;font-weight:800;letter-spacing:.12em}.admin h1{font-size:32px;letter-spacing:-.04em;margin:8px 0 28px}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:15px}.stat,.mini-grid>div,.admin-grid section,.wide{background:#fff;border:1px solid #e5e5e7;border-radius:10px}.stat{padding:22px}.stat span,.mini-grid span{color:#777;font-size:12px}.stat strong{display:block;font-size:29px;margin-top:12px}.mini-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:15px;margin-top:15px}.mini-grid>div{padding:15px 18px;display:flex;justify-content:space-between;align-items:center}.mini-grid b{font-size:18px}.admin-grid{display:grid;grid-template-columns:1.55fr 1fr;gap:15px;margin-top:20px}.admin-grid section,.wide{padding:22px}.wide{margin-top:15px}.section-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}.section-head h2{font-size:15px;margin:0}.section-head span{font-size:11px;color:#999}.table{font-size:12px}.thead,.tr{display:grid;grid-template-columns:1.5fr 1fr 1.4fr 1fr;gap:10px;padding:13px 8px;border-bottom:1px solid #eee}.thead{color:#999;font-size:10px;font-weight:800}.tr b,.tr small{display:block}.tr small{color:#999;margin-top:3px}.good{color:#29945b}.bad{color:#b42318}.activity{max-height:430px;overflow:auto}.event{padding:12px 0;border-bottom:1px solid #eee;font-size:12px}.event span,.event small,.event time{display:block}.event span{margin-top:3px;color:#555}.event small{color:#777;margin-top:4px}.event time{color:#aaa;margin-top:4px;font-size:10px}.empty{padding:30px;text-align:center;color:#999;font-size:12px}@media(max-width:900px){.stats,.mini-grid,.admin-grid{grid-template-columns:1fr 1fr}.admin-main{padding:25px 18px}}@media(max-width:600px){.stats,.mini-grid,.admin-grid{grid-template-columns:1fr}.admin header{padding:0 18px}.admin header>span{display:none}.thead,.tr{grid-template-columns:1.4fr 1fr 1fr}.thead span:nth-child(3),.tr span:nth-child(3){display:none}}`}
    </style>
  </main>
}