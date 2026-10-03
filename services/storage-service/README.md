# Storage Service

The storage service is the file-manager data plane.

## Responsibilities

- Per-project storage roots.
- File and directory metadata.
- Upload/download streaming.
- Rename and delete.
- Storage quotas.
- Path traversal protection.
- Audit events.
- Backups and snapshots.

PostgreSQL stores metadata. File bytes belong on dedicated storage, object storage, or a mounted volume.

Customer paths must be normalized and resolved beneath the project root. Never allow traversal, host paths, symlink escapes, or cross-customer access.

The next storage step is signed upload/download URLs so large files bypass the Next.js process.
