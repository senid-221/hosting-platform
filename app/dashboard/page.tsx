const services = [
  ["Websites","4","Online websites"],
  ["Domains","7","Managed domains"],
  ["Databases","5","Active databases"],
  ["Email","18","Mailboxes"],
];

export default function Dashboard() {
  return <main className="dashboard">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">H</span><span>Hosting Platform</span></div>
      <div className="side-group"><small>ACCOUNT</small><a className="active">Home</a><a>Websites</a><a>Hosting</a><a>Domains</a><a>VPS</a></div>
      <div className="side-group"><small>TOOLS</small><a>Databases</a><a>File Manager</a><a>DNS</a><a>SSL</a><a>Backups</a><a>Deployments</a></div>
      <div className="side-group"><small>ACCOUNT</small><a>Billing</a><a>Support</a><a>Settings</a></div>
    </aside>
    <section className="dashboard-main">
      <header className="dash-header"><div><span className="muted">Home</span><h1>Welcome back</h1></div><button>+ New website</button></header>
      <div className="notice"><div><b>Your hosting platform is ready.</b><span>Connect a domain or deploy your first application.</span></div><span>→</span></div>
      <div className="service-grid">{services.map(([name,value,text])=><div className="service-card" key={name}><span>{name}</span><strong>{value}</strong><small>{text}</small></div>)}</div>
      <div className="content-grid">
        <div className="card"><div className="card-title"><div><b>Websites</b><span>Manage your hosted websites</span></div><a>View all →</a></div>
          {["mybusiness.com","my-project.yourhost.com","store.example.com"].map((site,i)=><div className="row" key={site}><div className="site-dot">W</div><div><b>{site}</b><span>{i===0?"WordPress":"Application hosting"}</span></div><em>● Online</em></div>)}
        </div>
        <div className="card"><div className="card-title"><div><b>Resource usage</b><span>Current billing period</span></div></div>
          {[["Storage","24.8 / 100 GB","25%"],["Bandwidth","41 / 500 GB","8%"],["CPU","12%","12%"]].map(([n,v,w])=><div className="usage" key={n}><div><span>{n}</span><b>{v}</b></div><i><u style={{width:w}}/></i></div>)}
        </div>
        <div className="card full"><div className="card-title"><div><b>Recent deployments</b><span>Latest application activity</span></div><a>View deployments →</a></div>
          {[["my-project","Production · main","Success","2 min ago"],["api-service","Production · main","Success","1 hour ago"]].map(([n,s,status,time])=><div className="row" key={n}><div className="site-dot">D</div><div><b>{n}</b><span>{s}</span></div><em>{status}</em><small>{time}</small></div>)}
        </div>
      </div>
    </section>
    <style jsx>{`
      .dashboard{min-height:100vh;background:#f7f7f8;display:flex;color:#222}.sidebar{width:245px;background:#fff;border-right:1px solid #e8e8e8;padding:24px 15px;position:fixed;inset:0 auto 0 0}.brand{display:flex;align-items:center;gap:10px;font-weight:750;padding:0 10px 28px}.brand-mark{display:grid;place-items:center;width:30px;height:30px;border-radius:8px;background:#673de6;color:#fff;font-weight:800}.side-group{display:flex;flex-direction:column;margin:7px 0 22px}.side-group small{font-size:10px;color:#999;font-weight:800;letter-spacing:.1em;padding:0 11px 7px}.side-group a{padding:10px 11px;border-radius:7px;color:#62626b;font-size:13px}.side-group a.active,.side-group a:hover{background:#f0ecff;color:#673de6;font-weight:700}.dashboard-main{margin-left:245px;width:calc(100% - 245px);padding:34px 42px;max-width:1450px}.dash-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:28px}.dash-header h1{font-size:27px;letter-spacing:-.03em;margin:5px 0}.muted{color:#888;font-size:12px}.dash-header button{border:0;background:#673de6;color:#fff;border-radius:7px;padding:11px 15px;font-weight:700}.notice{background:#f0ecff;border:1px solid #ddd5ff;padding:17px 20px;border-radius:9px;display:flex;justify-content:space-between;color:#5132c4;margin-bottom:22px}.notice span{display:block;color:#6e6195;font-size:12px;margin-top:3px}.service-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}.service-card,.card{background:#fff;border:1px solid #e6e6e8;border-radius:10px}.service-card{padding:18px}.service-card span{color:#666;font-size:12px}.service-card strong{display:block;font-size:27px;margin:16px 0 2px}.service-card small{color:#999;font-size:11px}.content-grid{display:grid;grid-template-columns:1.35fr 1fr;gap:15px;margin-top:15px}.card{padding:20px}.full{grid-column:1/-1}.card-title{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:17px}.card-title b{display:block;font-size:14px}.card-title span{display:block;font-size:11px;color:#999;margin-top:4px}.card-title a{font-size:11px;color:#673de6;font-weight:700}.row{display:flex;align-items:center;gap:12px;padding:13px 0;border-top:1px solid #eee}.row b{display:block;font-size:12px}.row span,.row small{display:block;color:#999;font-size:10px;margin-top:3px}.row em{margin-left:auto;color:#29945b;font-size:10px;font-style:normal}.row>small{margin-left:8px}.site-dot{width:34px;height:34px;background:#f1eff7;color:#673de6;border-radius:7px;display:grid;place-items:center;font-size:11px;font-weight:800}.usage{margin:18px 0}.usage>div{display:flex;justify-content:space-between;font-size:11px;margin-bottom:7px}.usage b{font-size:10px;color:#777}.usage i{height:6px;background:#eee;display:block;border-radius:20px;overflow:hidden}.usage u{display:block;height:100%;background:#673de6;border-radius:20px}@media(max-width:900px){.sidebar{display:none}.dashboard-main{margin-left:0;width:100%;padding:25px 18px}.service-grid,.content-grid{grid-template-columns:1fr 1fr}.full{grid-column:1/-1}}@media(max-width:560px){.service-grid,.content-grid{grid-template-columns:1fr}.full{grid-column:auto}}
    `}</style>
  </main>
}