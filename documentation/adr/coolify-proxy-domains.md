# ADR-007: Coolify Proxy for Production Domains

## Context

The platform needs three public HTTPS entry points: the main frontend, the backend API used by that frontend, and the documentation portal. The containers themselves run on internal ports and should not manage public TLS certificates individually.

## Decision

Production domains are routed through the Coolify proxy:

- `https://usecontent.app` routes to the frontend resource;
- `https://api.usecontent.app` routes to the backend resource;
- `https://docs.usecontent.app` routes to the documentation static app.

Coolify handles TLS certificates and routes traffic to the correct resource. The backend remains on internal port `8080` and is not published as a public host port.

## Consequences

- Frontend nginx does not need certificate files.
- Backend code does not need to know about TLS termination.
- CORS can be strict because the production frontend origin is known.
- Raw IP and port-based URLs are removed from production frontend/backend configuration.
- Proxy availability becomes part of the operational baseline.

## Alternatives considered

Running a separate manually configured nginx reverse proxy was rejected for now because Coolify already owns deployment routing and certificate automation. Publishing backend port `8080` directly was rejected because it bypasses the proxy and complicates HTTPS/CORS behavior.

