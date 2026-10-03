import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,50);
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error:"Unauthorized" },{status:401});
  const projects = await prisma.project.findMany({
    where:{userId:user.id},
    include:{deployments:{orderBy:{createdAt:"desc"},take:3},domains:true},
    orderBy:{createdAt:"desc"}
  });
  return NextResponse.json({projects});
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error:"Unauthorized" },{status:401});
  try {
    const body=await request.json();
    const name=String(body.name??"").trim();
    if (!name) return NextResponse.json({error:"Project name is required."},{status:400});
    const base=slugify(name)||"project";
    let slug=base; let n=1;
    while(await prisma.project.findUnique({where:{slug}})){ slug=`${base}-${n++}`; }
    const project=await prisma.project.create({
      data:{
        name,slug,userId:user.id,
        repositoryUrl: body.repositoryUrl ? String(body.repositoryUrl) : null,
        repositoryBranch: String(body.repositoryBranch||"main"),
        framework: body.framework ? String(body.framework) : null,
        buildCommand: body.buildCommand ? String(body.buildCommand) : null,
        startCommand: body.startCommand ? String(body.startCommand) : null,
        port: body.port ? Number(body.port) : null
      }
    });
    return NextResponse.json({project},{status:201});
  } catch {
    return NextResponse.json({error:"Unable to create project."},{status:500});
  }
}
