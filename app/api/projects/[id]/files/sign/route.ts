import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { safeRelativePath, signStorageRequest } from "@/lib/storage";

export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
  const user=await getCurrentUser();
  if(!user) return NextResponse.json({error:"Unauthorized"},{status:401});
  const {id}=await params;
  const project=await prisma.project.findFirst({where:{id,userId:user.id}});
  if(!project) return NextResponse.json({error:"Project not found."},{status:404});
  const body=await request.json();
  let filePath:string;
  try { filePath=safeRelativePath(String(body.path||"")); } catch { return NextResponse.json({error:"Invalid storage path."},{status:400}); }
  const operation=body.action==="download" ? "download" : "upload";
  const signed=signStorageRequest(id,filePath,operation);
  const base=process.env.STORAGE_PUBLIC_URL || "/api/storage";
  const queryParams=new URLSearchParams({projectId:id,path:filePath,action:operation,expires:String(signed.expires),signature:signed.signature});
  return NextResponse.json({url:base+"?"+queryParams.toString(),expires:signed.expires});
}
