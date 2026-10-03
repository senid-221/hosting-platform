import { ArrowRight, Check, Globe, Server, ShieldCheck, Zap } from "lucide-react";

const products = [
  ["Web Hosting","Fast, reliable hosting for business websites and personal projects.",Globe],
  ["Application Hosting","Deploy Node.js, Python, PHP, Docker and Git-based applications.",Zap],
  ["VPS","Dedicated virtual resources with full server control.",Server],
  ["Security & SSL","Automatic HTTPS, backups and infrastructure protection.",ShieldCheck],
] as const;

export default function Home() {
  return <main>
    <header className="topbar"><div className="container nav">
      <div className="brand"><span className="brand-mark">H</span><span>Hosting Platform</span></div>
      <nav><a href="#hosting">Hosting</a><a href="#domains">Domains</a><a href="#developers">Developers</a><a href="#pricing">Pricing</a></nav>
      <div className="nav-actions"><a href="/login">Log in</a><a href="/dashboard" className="button small">Get started</a></div>
    </div></header>
    <section className="hero"><div className="container hero-grid"><div>
      <div className="eyebrow">HOSTING, SIMPLIFIED</div>
      <h1>Everything you need to build, host and grow online.</h1>
      <p className="hero-copy">Host websites, deploy applications, manage domains, databases and servers from one simple control panel.</p>
      <div className="hero-actions"><a href="/dashboard" className="button">Start building <ArrowRight size={17}/></a><a href="#hosting" className="secondary-button">Explore hosting</a></div>
      <div className="trust"><span><Check size={16}/> Free SSL</span><span><Check size={16}/> Automatic backups</span><span><Check size={16}/> Developer deployments</span></div>
    </div><div className="hero-panel">
      <div className="panel-header"><span>Hosting dashboard</span><span className="status">● All systems operational</span></div>
      <div className="metric-grid"><div className="metric"><small>WEBSITES</small><strong>12</strong><span>Active projects</span></div><div className="metric"><small>DOMAINS</small><strong>8</strong><span>Managed domains</span></div><div className="metric"><small>STORAGE</small><strong>24.8 GB</strong><span>of 100 GB</span></div><div className="metric"><small>UPTIME</small><strong>99.99%</strong><span>Last 30 days</span></div></div>
      <div className="deployment"><div><b>my-project</b><span>Production</span></div><span className="live">● Live</span></div>
    </div></div></section>
    <section id="hosting" className="section"><div className="container"><div className="section-heading"><span className="eyebrow">ONE PLATFORM</span><h2>All your hosting tools in one place.</h2><p>Start simple and scale as your website or application grows.</p></div>
      <div className="product-grid">{products.map(([title,text,Icon])=><div className="product-card" key={title}><div className="icon-box"><Icon size={21}/></div><h3>{title}</h3><p>{text}</p><a href="/dashboard">Learn more <ArrowRight size={15}/></a></div>)}</div>
    </div></section>
    <section id="developers" className="dark-section"><div className="container developer-grid"><div><span className="eyebrow">FOR DEVELOPERS</span><h2>Push code. We handle the infrastructure.</h2><p>Connect GitHub, configure your build, deploy to an isolated runtime and get a production URL automatically.</p><a href="/dashboard" className="button">Create a project <ArrowRight size={17}/></a></div><pre>{`$ git push origin main

→ Build started
→ Dependencies installed
→ Tests passed
→ Container deployed
→ SSL configured

✓ https://my-project.yourhost.com`}</pre></div></section>
    <footer><div className="container footer"><div><div className="brand"><span className="brand-mark">H</span><span>Hosting Platform</span></div><p>Independent hosting infrastructure for websites, applications and businesses.</p></div><div><b>Platform</b><a href="/dashboard">Dashboard</a><a href="#hosting">Hosting</a><a href="#domains">Domains</a></div><div><b>Developers</b><a href="/dashboard">Deployments</a><a href="/dashboard">Databases</a><a href="/dashboard">Servers</a></div></div></footer>
  </main>;
}