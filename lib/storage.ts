import crypto from "node:crypto";

export type StorageOperation = "upload" | "download";

const DEFAULT_TTL_SECONDS = 300;

function signingKey() {
  const secret = process.env.STORAGE_SIGNING_SECRET;
  if (!secret) throw new Error("STORAGE_SIGNING_SECRET is required to sign storage URLs.");
  return secret;
}

export function safeRelativePath(value: string) {
  const input = value.trim().replace(/\\/g, "/");
  if (!input || input.includes("\0")) throw new Error("Invalid storage path.");
  if (/^[a-zA-Z]:/.test(input) || input.startsWith("//")) throw new Error("Invalid storage path.");

  const segments = input.split("/").filter(segment => segment !== "" && segment !== ".");
  if (segments.some(segment => segment === "..")) throw new Error("Invalid storage path.");
  if (!segments.length) throw new Error("Invalid storage path.");
  return segments.join("/");
}

function payload(projectId: string, path: string, operation: StorageOperation, expires: number) {
  return [projectId, path, operation, String(expires)].join("\n");
}

export function signStorageRequest(projectId: string, path: string, operation: StorageOperation, ttlSeconds = Number(process.env.STORAGE_SIGNED_URL_TTL_SECONDS ?? DEFAULT_TTL_SECONDS)) {
  const expires = Date.now() + Math.max(1, ttlSeconds) * 1000;
  const signature = crypto.createHmac("sha256", signingKey()).update(payload(projectId, path, operation, expires)).digest("hex");
  return { expires, signature };
}

export function verifyStorageSignature(projectId: string, path: string, operation: StorageOperation, expires: number, signature: string) {
  if (!Number.isFinite(expires) || expires <= Date.now()) return false;
  const expected = crypto.createHmac("sha256", signingKey()).update(payload(projectId, path, operation, expires)).digest();
  const provided = Buffer.from(signature ?? "", "hex");
  return provided.length === expected.length && crypto.timingSafeEqual(provided, expected);
}
