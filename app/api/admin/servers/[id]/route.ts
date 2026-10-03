import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){
  const gate=await requireAdmin(); if(gate.response) return gate.response;
  const {id}=await params;
  const server=await prisma.server.findUnique({where:{id}});
  if(!server) return NextResponse.json({error:"Server not found."},{status:404});
  return NextResponse.json({server});
}

export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){
  const gate=await requireAdmin(); if(gate.response) return gate.response;
  const {id}=await params; const body=await request.json();
  const data:any={};
  for(const key of ["name","hostname","region","active","status","health"]) if(body[key]!==undefined) data[key]=body[key];
  for(const key of ["cpuCores","memoryGb","storageGb"]) if(body[key]!==undefined) data[key]=Math.max(1,Number(body[key]));
  const server=await prisma.server.update({where:{id},data});
  return NextResponse.json({server});
}

export async function DELETE(_:Request,{params}:{params:Promise<{id:string}>}){
  const gate=await requireAdmin(); if(gate.response) return gate.response;
  const {id}=await params;
  await prisma.server.delete({where:{id}});
  return NextResponse.json({ok:true});
}
