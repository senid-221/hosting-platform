# Domain Service

Owns domain verification, DNS records, project binding and TLS lifecycle.

## Verification

A newly added domain receives a server-generated verification token. Production verification must query authoritative DNS and require the expected TXT record before setting `verified=true`.

## DNS

Customer DNS records are stored in PostgreSQL and should be reconciled through the selected DNS provider adapter. The control plane must validate record type, name, value and TTL before applying changes.

## Project binding

A verified domain can be attached to a project owned by the same customer. Routing should only expose a domain when its project has a READY deployment.

## TLS

SSL requests move through a provider adapter. The domain must be verified before certificate issuance. Certificate state is persisted as PENDING, REQUESTED, ACTIVE or FAILED.

The reverse proxy is responsible for serving the active certificate and routing HTTPS traffic to the private runtime.
