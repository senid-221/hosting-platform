# Node Health Worker

Control-plane worker responsible for reconciling stale hosting nodes.

It periodically checks ONLINE nodes against NODE_HEARTBEAT_TIMEOUT_SECONDS. Nodes that stop reporting heartbeats are marked UNHEALTHY and DRAINING, preventing new deployments from being scheduled onto them.

Run this worker as a single control-plane process in production. It should have DATABASE_URL and the node health threshold environment variables.