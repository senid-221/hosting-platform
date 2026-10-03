"use client";
import {useEffect,useState} from "react";

export default function ProjectControl({params}:{params:Promise<{id:string}>}){
  const[id,setId]=useState("");const[p,setP]=useState<any>(null);const[tab,setTab]=useState("overview");
  const[key,setKey]=useState("");const[value,setValue]=useState("");const[busy,setBusy]=useState(false);const[msg,setMsg]=useState("");const[detail,setDetail]=useState<any>(null);const[commands,setCommands]=useState<any[]>([]);

  useEffect(()=>{params.then(x=>setId(x.id))},[params]);
  useEffect(()=>{if(id)load()},[id]);
  useEffect(()=>{if(!id)return;const t=setInterval(load,5000);return()=>clearInterval(t)},[id]);

  async function load(){
    const r=await fetch("/api/projects/"+id);const x=await r.json();
    if(r.ok){
      setP(x.project);
      const latest=x.project.deployments?.[0];
      if(latest){const dr=await fetch("/api/deployments/"+latest.id);const dx=await dr.json();if(dr.ok)setDetail(dx.deployment)}
      const cr=await fetch("/api/projects/"+id+"/runtime");const cx=await cr.json();if(cr.ok)setCommands(cx.commands||[]);
    }
  }

  async function deploy(){
    setBusy(true);setMsg("");
    const r=await fetch("/api/projects/"+id+"/deploy",{method:"POST"});const x=await r.json();
    setMsg(r.ok?"Deployment queued.":x.error||"Deployment failed");setBusy(false);load();
  }

  async function runtimeAction(action:"RESTART"|"STOP"){
    setBusy(true);setMsg("");
    const r=await fetch("/api/projects/"+id+"/runtime",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action})});
    const x=await r.json();
    setMsg(r.ok?(action==="RESTART"?"Restart command queued.":"Stop command queued."):x.error||"Runtime action failed");
    setBusy(false);load();
  }

  async function addEnv(){
    if(!key||!value)return;setBusy(true);
    const r=await fetch("/api/projects/"+id+"/environment",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({key,value})});
    const x=await r.json();setMsg(r.ok?"Environment variable saved.":x.error||"Unable to save");setKey("");setValue("");setBusy(false);load();
  }

  if(!p)return <main className="service-page"><div className="empty-state">Loading project…</div></main>;

  const running=p.status==="RUNNING";
  const stopped=p.status==="STOPPED";
  const failed=p.status==="FAILED";
  const activeCommand=commands.find((c:any)=>c.status==="QUEUED"||c.status==="RUNNING");

  return <main className="service-page">
    <header className="service-header">
      <div><a className="muted" href="/dashboard/projects">← Projects</a><h1>{p.name}</h1><p>{p.repositoryUrl||"No repository connected"} · {p.repositoryBranch}</p></div>
      <div className="project-actions">
        {(running||failed)&&<button className="secondary-button" onClick={()=>runtimeAction("RESTART")} disabled={busy||!!activeCommand}>{busy?"Working…":"Restart"}</button>}
        {running&&<button className="secondary-button" onClick={()=>runtimeAction("STOP")} disabled={busy||!!activeCommand}>{busy?"Working…":"Stop"}</button>}
        {(stopped||failed)&&<button className="button" onClick={deploy} disabled={busy}>{busy?"Working…":failed?"Redeploy":"Start"}</button>}
        {!stopped&&!failed&&!running&&<button className="button" onClick={deploy} disabled={busy}>{busy?"Working…":"Deploy"}</button>}
        {p.publicUrl&&<a className="secondary-button" href={p.publicUrl} target="_blank">Open site ↗</a>}
      </div>
    </header>
    {msg&&<div className="notice">{msg}</div>}
    <div className="control-status"><b className={running?"status-running":failed?"status-failed":"status-building"}>● {p.status}</b><span>{p.publicUrl||"Public URL pending deployment"}</span><span>{p.runtimeContainer||"Runtime not provisioned"}</span>{activeCommand&&<span>Action: {activeCommand.type} · {activeCommand.status}</span>}</div>
    <nav className="control-tabs">{["overview","deployments","domains","environment","backups"].map(x=><button className={tab===x?"active":""} onClick={()=>setTab(x)} key={x}>{x}</button>)}</nav>

    {tab==="overview"&&<><section className="control-grid">
      <article className="control-card"><small>RUNTIME</small><h3>{p.runtimeContainer||"Not running"}</h3><p>Port {p.runtimePort||"—"} · Health {p.healthPath}</p></article>
      <article className="control-card"><small>DOMAINS</small><h3>{p.domains?.length||0}</h3><p>{(p.domains||[]).filter((d:any)=>d.verified).length} verified</p></article>
      <article className="control-card"><small>ENVIRONMENT</small><h3>{p.environmentVariables?.length||0}</h3><p>Configured variables</p></article>
      <article className="control-card"><small>BACKUPS</small><h3>{p.backups?.length||0}</h3><p>Recent records</p></article>
    </section>
    <section className="service-card-panel control-section"><b>Runtime recovery</b><p className="muted">Restart or stop the current container without rebuilding the application. If the runtime fails health checks, the node reports the project as failed so it can be redeployed.</p><div className="project-actions">
      {(running||failed)&&<button className="secondary-button" onClick={()=>runtimeAction("RESTART")} disabled={busy||!!activeCommand}>Restart runtime</button>}
      {running&&<button className="secondary-button" onClick={()=>runtimeAction("STOP")} disabled={busy||!!activeCommand}>Stop runtime</button>}
      {(stopped||failed)&&<button className="button" onClick={deploy} disabled={busy}>{failed?"Redeploy":"Start deployment"}</button>}
    </div></section>
    <section className="service-card-panel control-section"><b>Project configuration</b><div className="config-grid"><span>Framework <b>{p.framework||"Auto-detect"}</b></span><span>Build <b>{p.buildCommand||"Default"}</b></span><span>Start <b>{p.startCommand||"Default"}</b></span><span>Port <b>{p.port||"Auto"}</b></span></div></section></>}

    {tab==="deployments"&&<section className="service-card-panel control-section"><div className="live-log-head"><div><b>Deployment history</b><span>Updates automatically every 5 seconds</span></div>{detail&&<span className="live-pill">● {detail.status}</span>}</div>{detail&&(detail.buildLog||detail.runtimeLog)&&<pre className="deploy-log">{[detail.buildLog,detail.runtimeLog].filter(Boolean).join("\n\n")}</pre>}{(p.deployments||[]).map((d:any)=><div className="service-row" key={d.id}><div><b>{d.commitSha||"Latest commit"}</b><span>{new Date(d.createdAt).toLocaleString()}</span></div><strong>{d.status}</strong><span>{d.server?.name||d.serverId||"Unassigned"}</span></div>)}{!p.deployments?.length&&<div className="empty-state">No deployments yet.</div>}</section>}

    {tab==="domains"&&<section className="service-card-panel control-section"><b>Domains</b>{(p.domains||[]).map((d:any)=><div className="service-row" key={d.id}><div><b>{d.name}</b><span>{d.verified?"Verified":"Pending verification"}</span></div><strong>{d.sslEnabled?"SSL ACTIVE":"SSL PENDING"}</strong><span>{d.sslStatus}</span></div>)}{!p.domains?.length&&<div className="empty-state">No domains connected.</div>}</section>}

    {tab==="environment"&&<section className="service-card-panel control-section"><b>Environment variables</b><div className="inline-form"><input placeholder="KEY" value={key} onChange={e=>setKey(e.target.value)}/><input placeholder="Value" value={value} onChange={e=>setValue(e.target.value)} type="password"/><button className="button" onClick={addEnv} disabled={busy}>Save</button></div>{(p.environmentVariables||[]).map((v:any)=><div className="service-row" key={v.id}><div><b>{v.key}</b><span>{v.environment}</span></div><strong>••••••••</strong><span>Protected</span></div>)}{!p.environmentVariables?.length&&<div className="empty-state">No variables configured.</div>}</section>}

    {tab==="backups"&&<section className="service-card-panel control-section"><b>Backups</b>{(p.backups||[]).map((b:any)=><div className="service-row" key={b.id}><div><b>{b.type}</b><span>{new Date(b.createdAt).toLocaleString()}</span></div><strong>{b.status}</strong><span>{b.retentionDays} days</span></div>)}{!p.backups?.length&&<div className="empty-state">No backups yet.</div>}</section>}
  </main>;
}