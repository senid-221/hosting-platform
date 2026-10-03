# Billing Service

Owns plans, subscriptions, invoices, usage and payment state.

Payment provider integrations should be isolated behind provider adapters so the customer portal does not depend on a single payment gateway.
