# ADR-006: VitePress Static Documentation Deployment

## Context

The project needs a documentation portal that can later be served from `docs.domain.com`.

## Decision

The documentation is implemented as a standalone VitePress project in `documentation/` and deployed as a Coolify Static App.

## Consequences

- No Dockerfile is required for documentation.
- No docker-compose service is added.
- Documentation can be built and deployed independently from the main app.
- Coolify can rebuild it automatically on push when auto deploy is enabled.

## Alternatives considered

An nginx Dockerfile was considered but not selected because VitePress output is static and Coolify can serve it directly.

