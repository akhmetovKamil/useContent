# ADR-001: Use MinIO instead of IPFS

## Context

The platform stores files that may be protected by subscriptions, token ownership or NFT ownership. Those files must not be freely retrievable when a reader does not satisfy the access policy.

## Decision

useContent stores binary content in MinIO and stores metadata in MongoDB.

## Consequences

- The backend can enforce access before issuing a download URL.
- Storage usage can be counted per author.
- Files can be deleted or cleaned up according to platform billing rules.
- The system depends on server-side object storage instead of decentralized public content addressing.

## Alternatives considered

IPFS was not selected because public content addressing does not match the current access-control model.

