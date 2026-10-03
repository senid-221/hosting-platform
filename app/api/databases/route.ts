import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encryptSecret } from "@/lib/secrets";

function password(){ return crypto.randomBytes(24).toString("base64url"); }
function dbName(name:string){ return "db_"+name.toLowerCase().replace(/[^a-z0-9_]/g,"_").slice(0,40); }

export async function GET(){
  const user=await getCurrentUser(); if(!user) return NextResponse.json({error:"Unauthorized"},{status:401});
  const databases=await prisma.hostedDatabase.findMany({where:{userId:user.id},select:{id:true,name:true,engine:true,host:true,port:true,username:true,databaseName:true,storageGb:true,maxConnections:true,status:true,createdAt:true},orderBy:{createdAt:"desc"}});
  return NextResponse.json({databases});
}

const engines = ["POSTGRESQL","MYSQL","REDIS"] as const;

export async function POST(request:Request){
  const user=await getCurrentUser(); if(!user) return NextResponse.json({error:"Unauthorized"},{status:401});
  const body=await request.json();
  const name=String(body.name??"").trim();
  const engine=engines.find(e=>e===String(body.engine??"POSTGRESQL").toUpperCase());
  if(!name) return NextResponse.json({error:"Database name is required."},{status:400});
  if(!engine) return NextResponse.json({error:"Unsupported database engine."},{status:400});
  const exists=await prisma.hostedDatabase.findUnique({where:{userId_name:{userId:user.id,name}}});
  if(exists) return NextResponse.json({error:"Database already exists."},{status:409});
  const plain=password();
  const db=await prisma.hostedDatabase.create({data:{name,engine,userId:user.id,username:"app_"+user.id.slice(-10),passwordHash:encryptSecret(plain),databaseName:dbName(name),port:engine==="POSTGRESQL"?5432:engine==="MYSQL"?3306:6379,storageGb:Math.max(1,Number(body.storageGb??5)),maxConnections:Math.max(1,Number(body.maxConnections??20)),status:"PROVISIONING"}});
  return NextResponse.json({database:{id:db.id,name:db.name,engine:db.engine,username:db.username,password:plain,databaseName:db.databaseName,port:db.port,storageGb:db.storageGb,maxConnections:db.maxConnections,status:db.status}},{status:201});
}
