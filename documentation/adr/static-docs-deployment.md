# ADR-006: VitePress Static Documentation Deployment

## Context

The project needs an engineering documentation portal that is served separately from the main application and does not require application runtime secrets.

## Decision

The documentation is implemented as a standalone VitePress project in `documentation/` and deployed as a Coolify Static App on `https://docs.usecontent.app`.

## Consequences

- No Dockerfile is required for documentation.
- No docker-compose service is added.
- Documentation can be built and deployed independently from the main app.
- GitHub Actions triggers a separate Coolify documentation webhook after pushes to `master`.
- The documentation domain receives TLS through the same Coolify proxy as the application domains.
- Documentation deploys do not need MongoDB, MinIO, RPC or wallet secrets.
- Architecture notes can be updated without recreating frontend/backend runtime containers.

## Alternatives considered

An nginx Dockerfile was considered but not selected because VitePress output is static and Coolify can serve it directly. Serving documentation from the main frontend container was rejected because docs changes should not require rebuilding the application image.
