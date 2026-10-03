# Deployment Worker

The deployment worker is the data-plane boundary for customer applications.

It will consume deployment jobs from Redis/BullMQ and execute builds in isolated Docker environments.

Planned flow:

1. Load deployment and project configuration.
2. Fetch the requested Git repository/commit.
3. Detect or validate the build configuration.
4. Build an immutable application image.
5. Start the runtime with CPU, memory, disk and process limits.
6. Run a health check.
7. Register the runtime with the reverse proxy.
8. Stream sanitized logs to the deployment record.
9. Mark the deployment READY or FAILED.

The worker must never execute arbitrary customer commands in the control-plane process.
