# Hosting Platform

A full-service hosting platform inspired by the workflows of modern hosting control panels such as Hostinger hPanel.

## Initial foundation

- Next.js + TypeScript customer portal
- Public hosting landing page
- Customer dashboard
- Admin dashboard
- PostgreSQL + Prisma data model
- Redis development service
- Project/deployment/domain/subscription/server models
- Docker development infrastructure

## Product scope

The platform is intended to grow into a complete hosting service:

- Shared web hosting
- WordPress hosting
- Git/application deployment
- Node.js, PHP and Python hosting
- Domains and DNS
- SSL
- Business email
- Databases
- File manager
- Backups
- VPS
- Billing and subscriptions
- Monitoring and server management

The UI direction is inspired by publicly available hosting product workflows, while using independent branding, implementation and visual assets.

## Local development

1. Install Node.js 24.x and pnpm.
2. Copy .env.example to .env.
3. Run docker compose up -d.
4. Run pnpm install.
5. Run pnpm db:generate.
6. Run pnpm db:push.
7. Run pnpm dev.

Then open http://localhost:3000.

Dashboard: /dashboard
Admin: /admin
