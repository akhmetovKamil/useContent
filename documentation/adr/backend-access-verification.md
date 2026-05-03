# ADR-002: Backend Access Verification

## Context

The frontend can render locked states, but client-side checks cannot protect API responses or file downloads.

## Decision

The backend is responsible for evaluating access policies before returning protected content or signed file URLs.

The frontend may render tier drawers, locked previews and missing-condition hints, but those states are informational. The backend reloads the relevant policy, entitlement and on-chain context for protected reads.

## Consequences

- Security does not depend on UI behavior.
- Token and NFT checks can be combined with stored entitlements.
- The frontend can still show helpful tier details, but the backend remains the source of truth.
- Signed URLs are only created after the same access path succeeds.
- Future clients can reuse the API without weakening access enforcement.

## Alternatives considered

Frontend-only checks were rejected because users can call APIs directly. Storing all access state on-chain was also rejected because comments, files, project trees and feed behavior need fast product iteration.
