import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/secrets";

export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){
  const user=await getCurrentUser(); if(!user) return NextResponse.json({error:"Unauthorized"},{status:401});
  const {id}=await params;
  const db=await prisma.hostedDatabase.findFirst({where:{id,userId:user.id}});
  if(!db) return NextResponse.json({error:"Database not found."},{status:404});
  return NextResponse.json({database:{id:db.id,name:db.name,engine:db.engine,host:db.host,port:db.port,username:db.username,password:decryptSecret(db.passwordHash),databaseName:db.databaseName,storageGb:db.storageGb,maxConnections:db.maxConnections,status:db.status}});
}

export async function DELETE(_:Request,{params}:{params:Promise<{id:string}>}){
  const user=await getCurrentUser(); if(!user) return NextResponse.json({error:"Unauthorized"},{status:401});
  const {id}=await params;
  const db=await prisma.hostedDatabase.findFirst({where:{id,userId:user.id}});
  if(!db) return NextResponse.json({error:"Database not found."},{status:404});
  await prisma.hostedDatabase.delete({where:{id}});
  return NextResponse.json({ok:true});
}
