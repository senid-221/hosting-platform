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
    },
    omit: { agentTokenHash: true }
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
      maxConcurrentDeployments: server.maxConcurrentDeployments,
      reservedCpuPercent: server.reservedCpuPercent,
      reservedMemoryGb: server.reservedMemoryGb,
      reservedStorageGb: server.reservedStorageGb,
      activeDeployments,
      availableDeploymentSlots: Math.max(0, server.maxConcurrentDeployments - activeDeployments),
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
  if (body.maxConcurrentDeployments !== undefined) data.maxConcurrentDeployments = Math.max(1, Math.floor(Number(body.maxConcurrentDeployments)));
  for (const key of ["reservedCpuPercent","reservedMemoryGb","reservedStorageGb"] as const) if (body[key] !== undefined) data[key] = Math.max(0, Number(body[key]));
  for (const key of ["name","hostname","region"] as const) if (body[key] !== undefined) data[key] = String(body[key]).trim();

  if (body.action === "ACTIVATE") { data.active = true; data.status = "ONLINE"; data.drainReason = "NONE"; }
  if (body.action === "DEACTIVATE") { data.active = false; data.status = "OFFLINE"; data.drainReason = "ADMIN"; }
  if (body.action === "DRAIN") { data.active = true; data.status = "DRAINING"; data.drainReason = "ADMIN"; }
  if (body.action === "MAINTENANCE") { data.active = false; data.status = "MAINTENANCE"; data.drainReason = "ADMIN"; }
  if (body.action === "ONLINE") { data.active = true; data.status = "ONLINE"; data.drainReason = "NONE"; }

  if (body.action && !["ACTIVATE","DEACTIVATE","DRAIN","MAINTENANCE","ONLINE"].includes(body.action)) {
    return NextResponse.json({ error: "Invalid node action." }, { status: 400 });
  }

  const server = await prisma.server.update({ where: { id }, data, omit: { agentTokenHash: true } });
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