import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ProjectsPage(){
  const user=await getCurrentUser(); if(!user) redirect("/login");
  const projects=await prisma.project.findMany({where:{userId:user.id},include:{deployments:{orderBy:{createdAt:"desc"},take:1}},orderBy:{createdAt:"desc"}});
  return <main className="dashboard">
    <aside className="sidebar"><div className="brand"><span className="brand-mark">H</span><span>Hosting Platform</span></div><div className="side-group"><small>ACCOUNT</small><Link href="/dashboard">Home</Link><Link className="active" href="/dashboard/projects">Projects</Link><a>Domains</a><a>VPS</a></div><div className="side-group"><small>TOOLS</small><a>Databases</a><a>File Manager</a><a>DNS</a><a>SSL</a><a>Backups</a><a>Deployments</a></div></aside>
    <section className="dashboard-main"><header className="dash-header"><div><span className="muted">Developer hosting</span><h1>Projects</h1></div><Link className="dash-header button-link" href="/dashboard/projects/new">+ New project</Link></header>
      <div className="project-list">{projects.length===0?<div className="notice"><div><b>No projects yet.</b><span>Create your first project and connect a Git repository.</span></div><Link href="/dashboard/projects/new">Create project →</Link></div>:projects.map(p=><article className="project-row" key={p.id}><div><strong>{p.name}</strong><span>{p.repositoryUrl||"No repository connected"} · {p.repositoryBranch}</span></div><div><b className={`status-${p.status.toLowerCase()}`}>{p.status}</b><span>{p.deployments[0]?.status||"No deployments"}</span></div></article>)}</div>
    </section>
  </main>;
}
