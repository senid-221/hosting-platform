import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

const statuses = ["ONLINE","OFFLINE","DRAINING","MAINTENANCE"] as const;
const healthValues = ["UNKNOWN","HEALTHY","DEGRADED","UNHEALTHY"] as const;

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin();
  if (gate.response) return gate.response;
  const { id } = await params;
  const server = await prisma.server.findUnique({
    where: { id },
    include: {
      _count: { select: { deployments: true, runtimeCommands: true, runtimeEvents: true } }
    }
  });
  if (!server) return NextResponse.json({ error: "Server not found." }, { status: 404 });

  const [activeDeployments, runningCommands, runningProjects] = await Promise.all([
    prisma.deployment.count({ where: { serverId: id, status: { in: ["QUEUED","BUILDING","DEPLOYING"] } } }),
    prisma.runtimeCommand.count({ where: { serverId: id, status: { in: ["QUEUED","RUNNING"] } } }),
    prisma.project.count({ where: { status: "RUNNING", deployments: { some: { serverId: id, status: "READY" } } } })
  ]);

  return NextResponse.json({
    server,
    capacity: {
      cpuPercent: server.cpuUsedPercent,
      memoryPercent: server.memoryGb ? (server.memoryUsedGb / server.memoryGb) * 100 : 0,
      storagePercent: server.storageGb ? (server.storageUsedGb / server.storageGb) * 100 : 0,
      activeDeployments,
      runningCommands,
      runningProjects
    }
  });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin();
  if (gate.response) return gate.response;
  const { id } = await params;
  const body = await request.json();
  const current = await prisma.server.findUnique({ where: { id } });
  if (!current) return NextResponse.json({ error: "Server not found." }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (body.status !== undefined) {
    if (!statuses.includes(body.status)) return NextResponse.json({ error: "Invalid server status." }, { status: 400 });
    data.status = body.status;
  }
  if (body.health !== undefined) {
    if (!healthValues.includes(body.health)) return NextResponse.json({ error: "Invalid health state." }, { status: 400 });
    data.health = body.health;
  }
  if (body.active !== undefined) data.active = Boolean(body.active);
  for (const key of ["name","hostname","region"] as const) if (body[key] !== undefined) data[key] = String(body[key]).trim();

  if (body.action === "ACTIVATE") { data.active = true; data.status = "ONLINE"; }
  if (body.action === "DEACTIVATE") { data.active = false; data.status = "OFFLINE"; }
  if (body.action === "DRAIN") { data.active = true; data.status = "DRAINING"; }
  if (body.action === "MAINTENANCE") { data.active = false; data.status = "MAINTENANCE"; }
  if (body.action === "ONLINE") { data.active = true; data.status = "ONLINE"; }

  if (body.action && !["ACTIVATE","DEACTIVATE","DRAIN","MAINTENANCE","ONLINE"].includes(body.action)) {
    return NextResponse.json({ error: "Invalid node action." }, { status: 400 });
  }

  const server = await prisma.server.update({ where: { id }, data });
  return NextResponse.json({ server });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin();
  if (gate.response) return gate.response;
  const { id } = await params;
  const active = await prisma.deployment.count({ where: { serverId: id, status: { in: ["QUEUED","BUILDING","DEPLOYING","READY"] } } });
  if (active > 0) return NextResponse.json({ error: "Cannot delete a node with active deployments. Drain it first." }, { status: 409 });
  await prisma.server.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}