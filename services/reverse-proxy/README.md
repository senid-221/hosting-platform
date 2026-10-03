# Reverse Proxy

The reverse proxy is the public edge for READY applications.

Flow:

DNS hostname -> TLS listener -> proxy lookup -> runtime container/port -> health check.

The proxy must only route projects whose deployment is READY. Runtime containers remain private on the internal runtime network and are never published directly to the internet.

Production implementation should use a dedicated proxy such as Caddy, Traefik, or Nginx, with automated certificate provisioning and renewal.

The control plane should generate proxy records from PostgreSQL rather than accepting arbitrary customer upstreams.
