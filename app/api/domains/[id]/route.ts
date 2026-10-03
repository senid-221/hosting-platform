import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_:Request,{params}:{params:Promise<{id:string}>}) {
  const user=await getCurrentUser(); if(!user) return NextResponse.json({error:"Unauthorized"},{status:401});
  const {id}=await params;
  const domain=await prisma.domain.findFirst({where:{id,project:{userId:user.id}},include:{records:true,project:true}});
  if(!domain) return NextResponse.json({error:"Domain not found."},{status:404});
  return NextResponse.json({domain});
}

export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}) {
  const user=await getCurrentUser(); if(!user) return NextResponse.json({error:"Unauthorized"},{status:401});
  const {id}=await params;
  const domain=await prisma.domain.findFirst({where:{id,project:{userId:user.id}}});
  if(!domain) return NextResponse.json({error:"Domain not found."},{status:404});
  const body=await request.json();
  let projectId=body.projectId===null?null:body.projectId===undefined?domain.projectId:String(body.projectId);
  if(projectId){
    const project=await prisma.project.findFirst({where:{id:projectId,userId:user.id}});
    if(!project) return NextResponse.json({error:"Project not found."},{status:404});
  }
  const updated=await prisma.domain.update({where:{id},data:{projectId}});
  return NextResponse.json({domain:updated});
}
