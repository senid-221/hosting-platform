"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewProjectPage() {
  const router=useRouter();
  const [name,setName]=useState(""); const [repositoryUrl,setRepositoryUrl]=useState("");
  const [branch,setBranch]=useState("main"); const [framework,setFramework]=useState("");
  const [error,setError]=useState(""); const [loading,setLoading]=useState(false);

  async function submit(e:FormEvent){
    e.preventDefault(); setError(""); setLoading(true);
    const res=await fetch("/api/projects",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({name,repositoryUrl,repositoryBranch:branch,framework})});
    const data=await res.json(); setLoading(false);
    if(!res.ok) return setError(data.error??"Unable to create project.");
    router.push("/dashboard/projects"); router.refresh();
  }

  return <main className="auth-page"><form className="auth-card" onSubmit={submit}>
    <Link href="/dashboard" className="auth-brand">H</Link>
    <h1>New project</h1><p>Create a website or application in your hosting control plane.</p>
    <label>Project name<input required value={name} onChange={e=>setName(e.target.value)} placeholder="My website"/></label>
    <label>Git repository URL<input value={repositoryUrl} onChange={e=>setRepositoryUrl(e.target.value)} placeholder="https://github.com/you/repository"/></label>
    <label>Branch<input value={branch} onChange={e=>setBranch(e.target.value)} placeholder="main"/></label>
    <label>Framework<input value={framework} onChange={e=>setFramework(e.target.value)} placeholder="Next.js, Node.js, PHP…"/></label>
    {error&&<div className="auth-error">{error}</div>}
    <button disabled={loading}>{loading?"Creating…":"Create project"}</button>
    <small><Link href="/dashboard">Cancel</Link></small>
  </form></main>;
}
