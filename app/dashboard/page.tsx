import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LayoutDashboard, Globe, Server, Database, FolderOpen, ShieldCheck, HardDrive, GitBranch, CreditCard, LifeBuoy, Settings, Search, Bell, LogOut, Menu } from "lucide-react";

export default async function Dashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const [projects, databases, domains, deployments] = await Promise.all([
    prisma.project.findMany({ where: { userId: user.id }, include: { domains: true }, orderBy: { updatedAt: "desc" } }),
    prisma.hostedDatabase.count({ where: { userId: user.id } }),
    prisma.domain.count({ where: { userId: user.id } }),
    prisma.deployment.findMany({ where: { project: { userId: user.id } }, include: { project: true }, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);
  const liveProjects = projects.filter(project => project.status === "RUNNING").length;
  const serviceCards = [
    ["Websites", String(projects.length), liveProjects + " online"],
    ["Domains", String(domains), "Managed domains"],
    ["Databases", String(databases), "Active databases"],
    ["Deployments", String(deployments.length), "Recent deployments"],
  ];
  return <main className="dashboard">
    <aside id="mobile-nav" className="sidebar"><div className="mobile-close"><a href="#" aria-label="Close navigation">×</a></div>
      <div className="brand"><span className="brand-mark">H</span><span>Hosting Platform</span></div>
      <div className="side-group"><small>ACCOUNT</small><a className="active" href="/dashboard"><LayoutDashboard size={15}/>Home</a><a href="/dashboard/projects"><Globe size={15}/>Websites</a><a href="/dashboard/projects"><Server size={15}/>Hosting</a><a href="/dashboard/domains"><Globe size={15}/>Domains</a><a href="/dashboard/vps"><Server size={15}/>VPS</a></div>
      <div className="side-group"><small>TOOLS</small><a href="/dashboard/databases"><Database size={15}/>Databases</a><a href="/dashboard/files"><FolderOpen size={15}/>File Manager</a><a href="/dashboard/dns"><Globe size={15}/>DNS</a><a href="/dashboard/ssl"><ShieldCheck size={15}/>SSL</a><a href="/dashboard/backups"><HardDrive size={15}/>Backups</a><a href="/dashboard/projects"><GitBranch size={15}/>Deployments</a></div>
      <div className="side-group"><small>ACCOUNT</small><a href="/dashboard/billing"><CreditCard size={15}/>Billing</a><a href="/dashboard/support"><LifeBuoy size={15}/>Support</a><a href="/dashboard/settings"><Settings size={15}/>Settings</a></div>
    </aside>
    <section className="dashboard-main"><div className="mobile-top"><a className="mobile-menu-button" href="#mobile-nav" aria-label="Open navigation"><Menu size={20}/></a><div className="mobile-brand"><span className="brand-mark">H</span>Hosting Platform</div></div>
      <header className="dash-header"><div><span className="muted">Home</span><h1>Welcome back{user.name ? `, ${user.name}` : ""}</h1></div><div className="header-tools"><label className="global-search"><Search size={16}/><input placeholder="Search..." aria-label="Search dashboard"/></label><button className="icon-button" aria-label="Notifications"><Bell size={17}/></button><a className="account-chip" href="/dashboard/settings">{(user.name || user.email).slice(0,1).toUpperCase()}</a><a className="button-link" href="/dashboard/projects/new">+ New website</a></div></header>
      <div className="notice"><div><b>Your hosting platform is ready.</b><span>Connect a domain or deploy your first application.</span></div><span>→</span></div>
      <div className="service-grid">{serviceCards.map(([name,value,text])=><div className="service-card" key={name}><span>{name}</span><strong>{value}</strong><small>{text}</small></div>)}</div>
      <div className="content-grid">
        <div className="card"><div className="card-title"><div><b>Websites</b><span>Manage your hosted websites</span></div><a>View all →</a></div>
          {projects.slice(0,3).map(project=><div className="row" key={project.id}><div className="site-dot">W</div><div><b>{project.name}</b><span>{project.publicUrl || project.slug}</span></div><em className={project.status === "RUNNING" ? "online" : ""}>● {project.status}</em></div>)}{projects.length===0&&<div className="empty-state">No websites yet. Create your first project to get started.</div>}
        </div>
        <div className="card"><div className="card-title"><div><b>Resource usage</b><span>Current billing period</span></div></div>
          {[["Storage","24.8 / 100 GB","25%"],["Bandwidth","41 / 500 GB","8%"],["CPU","12%","12%"]].map(([n,v,w])=><div className="usage" key={n}><div><span>{n}</span><b>{v}</b></div><i><u style={{width:w}}/></i></div>)}
        </div>
        <div className="card full"><div className="card-title"><div><b>Recent deployments</b><span>Latest application activity</span></div><a>View deployments →</a></div>
          {deployments.map(deployment=><div className="row" key={deployment.id}><div className="site-dot">D</div><div><b>{deployment.project.name}</b><span>Production · {deployment.project.repositoryBranch}</span></div><em>{deployment.status}</em><small>{new Date(deployment.createdAt).toLocaleString()}</small></div>)}{deployments.length===0&&<div className="empty-state">No deployments yet.</div>}
        </div>
      </div>
    </section>
  </main>
}