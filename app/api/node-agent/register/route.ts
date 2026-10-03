import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAgentToken, hashAgentToken, tokensMatch } from "@/lib/node-agent";

export async function POST(request:Request){
  const bootstrap=request.headers.get("x-node-bootstrap-token");
  if(!tokensMatch(bootstrap,process.env.NODE_BOOTSTRAP_TOKEN)) return NextResponse.json({error:"Invalid bootstrap token."},{status:401});
  const b=await request.json();
  const name=String(b.name||"").trim(), hostname=String(b.hostname||"").trim(), region=String(b.region||"").trim();
  const cpuCores=Math.max(1,Number(b.cpuCores||1)), memoryGb=Math.max(1,Number(b.memoryGb||1)), storageGb=Math.max(1,Number(b.storageGb||1));
  if(!name||!hostname||!region) return NextResponse.json({error:"name, hostname and region are required."},{status:400});
  const token=createAgentToken();
  const server=await prisma.server.upsert({
    where:{name},
    create:{name,hostname,region,cpuCores,memoryGb,storageGb,agentTokenHash:hashAgentToken(token),agentVersion:String(b.agentVersion||"unknown")},
    update:{hostname,region,cpuCores,memoryGb,storageGb,agentTokenHash:hashAgentToken(token),agentVersion:String(b.agentVersion||"unknown"),active:true,status:"ONLINE"}
  });
  return NextResponse.json({server:{id:server.id,name:server.name,hostname:server.hostname},token},{status:201});
}
