// Prisma maps BigInt columns (FileNode.sizeBytes, Backup.sizeBytes) to JS bigint,
// which JSON.stringify refuses to serialize. Every response containing those rows
// must pass through here or the route throws a 500.
export function jsonSafe<T>(value: T): T {
  return JSON.parse(JSON.stringify(value, (_key, entry) => (typeof entry === "bigint" ? Number(entry) : entry))) as T;
}
