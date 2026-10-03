import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

export function hashAgentToken(token:string){
  return createHash("sha256").update(token).digest("hex");
}

export function createAgentToken(){
  return randomBytes(32).toString("hex");
}

export async function authenticateAgent(request:Request){
  const auth=request.headers.get("authorization")||"";
  if(!auth.startsWith("Bearer ")) return null;
  const hash=hashAgentToken(auth.slice(7));
  return prisma.server.findFirst({where:{agentTokenHash:hash}});
}
