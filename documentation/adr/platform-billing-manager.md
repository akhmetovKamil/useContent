# ADR-005: Separate Platform Billing Managers

## Context

Reader subscriptions and author platform billing represent different payment relationships.

## Decision

useContent uses `PlatformTierManager` and `PlatformStorageManager` for author-to-platform billing instead of mixing this flow into `SubscriptionManager`.

The tier contract keeps creator plan price, included storage and billing period. The storage contract keeps extra storage price, maximum extra storage and billing period. The backend turns confirmed events into one author billing projection.

## Consequences

- Reader-to-author revenue split remains isolated.
- Platform billing can change tier and storage pricing independently.
- Backend confirmation updates author quota and features separately from reader entitlements.
- The platform can evolve author billing without changing reader subscription semantics.
- Contract events map cleanly to independent backend tier and storage projections.

## Alternatives considered

Reusing `SubscriptionManager` for platform billing was rejected because it would mix different payment semantics. A single platform contract was rejected because tier and storage pricing need to be changed and paid independently.
