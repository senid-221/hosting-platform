import { NextResponse } from "next/server";
import { reconcileNodeHealth } from "@/lib/scheduler";
import { tokensMatch } from "@/lib/node-agent";

export async function POST(request:Request){
  const token=request.headers.get("x-node-healthcheck-token");
  if(!tokensMatch(token,process.env.NODE_HEALTHCHECK_TOKEN))
    return NextResponse.json({error:"Unauthorized health check."},{status:401});
  return NextResponse.json(await reconcileNodeHealth());
}