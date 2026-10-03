import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { projectHostname, projectUrl } from "@/lib/routing";

export async function GET(_:Request,{params}:{params:Promise<{id:string}>}) {
  const user=await getCurrentUser(); if(!user) return NextResponse.json({error:"Unauthorized"},{status:401});
  const {id}=await params;
  const project=await prisma.project.findFirst({where:{id,userId:user.id}});
  if(!project) return NextResponse.json({error:"Project not found."},{status:404});
  return NextResponse.json({hostname:projectHostname(project.slug),publicUrl:project.publicUrl??projectUrl(project.slug),runtimePort:project.runtimePort,runtimeContainer:project.runtimeContainer,healthPath:project.healthPath});
}
