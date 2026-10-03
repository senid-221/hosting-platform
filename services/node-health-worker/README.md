# Node Health Worker

Control-plane worker responsible for reconciling stale hosting nodes.

It periodically checks ONLINE nodes against NODE_HEARTBEAT_TIMEOUT_SECONDS. Nodes that stop reporting heartbeats are marked UNHEALTHY and DRAINING, preventing new deployments from being scheduled onto them.

Run this worker as a single control-plane process in production. It should have DATABASE_URL and the node health threshold environment variables.

This worker also reconciles stale BUILDING/DEPLOYING deployments using DEPLOYMENT_HEARTBEAT_TIMEOUT_SECONDS. Deployments below maxRetries are reassigned to a healthy node and re-enqueued in BullMQ; deployments that exhaust retries are marked FAILED. It also requires REDIS_URL for deployment recovery.