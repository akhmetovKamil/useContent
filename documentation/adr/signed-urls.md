# ADR-003: Signed URLs for Protected Content Delivery

## Context

Protected files should be downloaded efficiently without proxying every byte through the backend.

## Decision

The backend verifies access and returns temporary signed URLs for MinIO objects.

## Consequences

- File transfer can happen directly from object storage.
- Access is checked before URL creation.
- URLs are time-limited and should not be treated as permanent public links.

## Alternatives considered

Streaming all files through the backend was not selected because it would increase backend load and complicate large downloads.

