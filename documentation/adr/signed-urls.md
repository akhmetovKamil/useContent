# ADR-003: Signed URLs for Protected Content Delivery

## Context

Protected files should be downloaded efficiently without proxying every byte through the backend.

## Decision

The backend verifies access and returns temporary signed URLs for MinIO objects.

The URL is treated as a short-lived capability. It is not stored as public content metadata and is regenerated only when a reader requests preview/download access.

## Consequences

- File transfer can happen directly from object storage.
- Access is checked before URL creation.
- URLs are time-limited and should not be treated as permanent public links.
- The backend avoids streaming every large file through the API process.
- The same mechanism can protect previews, single downloads, project files and generated bundles.

## Alternatives considered

Streaming all files through the backend was not selected because it would increase backend load and complicate large downloads. Public MinIO buckets were rejected because protected content needs backend-issued access.
