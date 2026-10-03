# Hosting Node Agent

The node agent runs on a data-plane server and communicates with the control plane over authenticated HTTPS.

## Lifecycle
1. A node is registered with the control plane using a protected bootstrap token.
2. The control plane returns a node-specific bearer token.
3. The token is stored only on the node.
4. The agent sends heartbeats and resource state.
5. Deployment execution can be performed locally on the node without exposing the Docker socket to the control plane.

The control plane remains responsible for authentication, scheduling, metadata, and policy. The node agent is responsible for local infrastructure operations.
