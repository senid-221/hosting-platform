# Billing & Usage Service

The billing layer tracks plans, subscriptions, invoices, payments, and measured resource usage.

## Usage
Storage is calculated from project file metadata, websites from project count, and databases from hosted database count. Bandwidth remains unmeasured until the data plane reports transfer bytes.

## API
- GET /api/plans
- GET /api/subscriptions
- POST /api/subscriptions
- GET /api/billing/invoices
- GET /api/billing/invoices/:id
- GET /api/billing/usage

## Production payments
Payment providers must be verified server-side through signed webhooks before a Payment is marked SUCCEEDED and an invoice is marked PAID. Client-side success flags must never be trusted.
