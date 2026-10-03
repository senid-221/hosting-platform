# Hosting Platform Architecture

## Control plane

The web and API layers manage customers, projects, plans, deployments, domains and infrastructure metadata.

## Data plane

Customer workloads run outside the Next.js process in isolated runtimes.

```
Customer
  -> Dashboard
  -> Control API
  -> Deployment Queue
  -> Worker
  -> Build Image
  -> Isolated Runtime
  -> Reverse Proxy
  -> HTTPS
```

## Services

### Web
Customer-facing marketing site and hosting control panel.

### Admin
Operations console for customers, plans, servers, deployments, domains and platform health.

### API
Authentication, authorization and resource management. No customer application code is executed here.

### Deployment worker
Consumes deployment jobs, clones source repositories, builds an immutable runtime artifact, starts an isolated workload and records logs/status.

### Scheduler
Chooses a healthy server with sufficient capacity for a new workload.

### Server manager
Maintains registered compute nodes and their capacity/health metadata.

### Domain service
Manages domain verification, DNS records and certificate provisioning.

### Billing service
Owns plans, subscriptions, invoices, usage and payment state.

## Security boundaries

- Customer code must never execute in the control-plane process.
- Runtime containers must not run privileged by default.
- Resource limits are mandatory for customer workloads.
- Secrets are encrypted at rest and never emitted into build logs.
- Internal infrastructure endpoints are never exposed directly to customers.
- Every deployment and administrative mutation should be auditable.

## Deployment lifecycle

```
QUEUED
  -> BUILDING
  -> DEPLOYING
  -> READY

failure at any stage -> FAILED
manual stop -> CANCELED
```

## Future infrastructure

The initial implementation can run on one Linux/Docker node. The scheduler and server model are deliberately separated so additional nodes can later be added without changing the customer-facing product.
