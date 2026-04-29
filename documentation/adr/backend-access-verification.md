# ADR-002: Backend Access Verification

## Context

The frontend can render locked states, but client-side checks cannot protect API responses or file downloads.

## Decision

The backend is responsible for evaluating access policies before returning protected content or signed file URLs.

## Consequences

- Security does not depend on UI behavior.
- Token and NFT checks can be combined with stored entitlements.
- The frontend can still show helpful tier details, but the backend remains the source of truth.

## Alternatives considered

Frontend-only checks were rejected because users can call APIs directly.

