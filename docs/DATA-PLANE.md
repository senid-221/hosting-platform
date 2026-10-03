# Data Plane

The data plane is the untrusted execution boundary for customer workloads.

Customer -> Control Plane API -> Redis deployment queue -> Deployment Worker -> isolated runtime -> Reverse Proxy/TLS -> Public application.

The Next.js control plane must never execute customer build commands itself.

## Runtime policy

Each application runtime should have CPU, memory and PID quotas, a read-only root filesystem where compatible, temporary writable storage only, dropped Linux capabilities, no-new-privileges, an isolated network, deployment timeouts and bounded logs.

Customer workloads must not receive host files, control-plane credentials, database credentials, Redis credentials, or privileged runtime access.

## Production hardening

1. Dedicated data-plane worker nodes.
2. Dedicated runtime network.
3. Egress and abuse controls.
4. Image and dependency scanning.
5. Per-customer quotas.
6. Runtime health checks and restart policy.
7. Reverse proxy in front of application runtimes.
8. TLS termination at the proxy.
9. Deployment and runtime audit events.
10. Node and container monitoring.
