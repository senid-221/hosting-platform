# Reverse Proxy

The reverse proxy is the public edge for READY applications.

## Runtime flow

DNS hostname -> Caddy TLS listener -> private `hosting-runtime` network -> runtime container/port -> active health check.

The node agent creates a private Docker network named by `NODE_RUNTIME_NETWORK`, starts application containers without published host ports, and renders one Caddy site block per READY deployment.

Each site can include:
- the platform hostname (`project-slug.<PLATFORM_BASE_DOMAIN>`)
- verified custom domains
- an internal container upstream
- an application health path

Caddy handles public HTTPS certificates for verified custom domains and the platform hostname. Runtime containers are never exposed directly to the internet.

## Node deployment

Start the edge proxy from this directory:

```bash
docker network create hosting-runtime
docker compose up -d
```

The node agent must share the Caddyfile volume/path with the Caddy container:
- host path: `CADDYFILE_PATH`
- Caddy container path: `CADDYFILE_CONTAINER_PATH`

Default Caddy container name: `hosting-caddy`.

The control plane remains the source of truth for project ownership and verified domains; the node agent only renders routes for deployments assigned to that node.
