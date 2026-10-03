import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Hosting Platform", description: "Web hosting, domains, deployments, databases and servers." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
