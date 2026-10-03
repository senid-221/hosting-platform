import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
  const gate=await requireAdmin(); if(gate.response) return gate.response;
  const {id}=await params; const body=await request.json();
  const server=await prisma.server.update({
    where:{id},
    data:{
      lastHeartbeatAt:new Date(),
      health:body.health||"HEALTHY",
      cpuUsedPercent:Number(body.cpuUsedPercent||0),
      memoryUsedGb:Number(body.memoryUsedGb||0),
      storageUsedGb:Number(body.storageUsedGb||0),
      status:"ONLINE"
    }
  });
  return NextResponse.json({server});
}
