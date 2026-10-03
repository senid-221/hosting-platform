import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jsonSafe } from "@/lib/json";

export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
  const user=await getCurrentUser();
  if(!user) return NextResponse.json({error:"Unauthorized"},{status:401});
  const {id}=await params;
  const url=new URL(request.url);
  const prefix=url.searchParams.get("path") || "/";
  const project=await prisma.project.findFirst({where:{id,userId:user.id}});
  if(!project) return NextResponse.json({error:"Project not found."},{status:404});
  const files=await prisma.fileNode.findMany({where:{projectId:id,path:{startsWith:prefix}},orderBy:{path:"asc"}});
  return NextResponse.json({files:jsonSafe(files)});
}

export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
  const user=await getCurrentUser();
  if(!user) return NextResponse.json({error:"Unauthorized"},{status:401});
  const {id}=await params;
  const project=await prisma.project.findFirst({where:{id,userId:user.id}});
  if(!project) return NextResponse.json({error:"Project not found."},{status:404});
  const body=await request.json();
  const input=String(body.path || "").trim();
  if(!input.startsWith("/") || input.includes("..")) return NextResponse.json({error:"Invalid file path."},{status:400});
  const type=body.type==="directory" ? "directory" : "file";
  const node=await prisma.fileNode.create({data:{projectId:id,path:input,type,sizeBytes:Number(body.sizeBytes||0),storageKey:crypto.randomUUID()}});
  return NextResponse.json({file:jsonSafe(node)},{status:201});
}
