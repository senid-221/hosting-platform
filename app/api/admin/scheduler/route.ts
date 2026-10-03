import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { selectDeploymentServer } from "@/lib/scheduler";

export async function GET(){
  const gate=await requireAdmin(); if(gate.response) return gate.response;
  const server=await selectDeploymentServer();
  return NextResponse.json({available:!!server,server});
}
