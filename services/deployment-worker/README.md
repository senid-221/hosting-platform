# Deployment Worker

Consumes the Redis `deployments` queue and executes customer application builds on a dedicated data-plane node.

## Lifecycle

1. Load deployment and project metadata from PostgreSQL.
2. Clone the requested Git branch into an ephemeral workspace.
3. Optionally checkout a requested commit SHA.
4. Build a Docker image outside the Next.js control-plane process.
5. Start the runtime with resource and Linux security limits.
6. Persist build/runtime logs and deployment state.
7. Mark the project `RUNNING` only after the runtime starts.
8. Remove the runtime and mark the deployment `FAILED` when an operation errors.

## Isolation defaults

The worker uses:

- memory and CPU limits
- PID limits
- read-only root filesystem
- a temporary `/tmp`
- dropped Linux capabilities
- `no-new-privileges`
- a dedicated Docker network
- ephemeral build workspaces
- build timeouts

The worker must run on a dedicated data-plane host. Do **not** mount the Docker socket into the Next.js web application.

## Required node setup

Create the dedicated runtime network before starting the worker:

```bash
docker network create hosting-runtime
```

The worker host needs Docker, Git, Node.js and access to PostgreSQL/Redis.

## Next step

The reverse-proxy service will map each READY runtime to a stable hostname, perform health checks, and terminate TLS without exposing Docker directly to customers.
