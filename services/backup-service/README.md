# Backup Service

The backup service owns backup creation, retention and restore operations.

## Backup types

- PROJECT: application files and deployment metadata.
- DATABASE: logical database backup.
- FULL: coordinated project plus database snapshot.

## Lifecycle

QUEUED -> RUNNING -> COMPLETED

Failures move to FAILED. Restore requests use RESTORING -> RESTORED or FAILED.

## Safety

Backups must be encrypted at rest, stored outside the customer runtime, checksummed, retained according to policy, and restored into an isolated temporary location before replacing live data.

Never overwrite a live project directly from an unverified archive.

## Retention

Every backup has a retention period and expiration timestamp. A scheduled cleanup job removes expired objects only after verifying they are not referenced by an active restore operation.
