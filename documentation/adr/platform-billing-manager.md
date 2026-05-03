# ADR-005: Separate Platform Billing Manager

## Context

Reader subscriptions and author platform billing represent different payment relationships.

## Decision

useContent uses `PlatformSubscriptionManager` for author-to-platform billing instead of mixing this flow into `SubscriptionManager`.

The contract keeps tier price, included storage, maximum extra storage and price per extra GB in one checkout flow. The backend turns confirmed events into author quota and feature state.

## Consequences

- Reader-to-author revenue split remains isolated.
- Platform billing can manage tier and extra storage as one author checkout.
- Backend confirmation updates author quota and features separately from reader entitlements.
- The platform can evolve author billing without changing reader subscription semantics.
- The contract event maps cleanly to one backend billing projection.

## Alternatives considered

Reusing `SubscriptionManager` for platform billing was rejected because it would mix different payment semantics. Splitting tier and storage into two contracts was also rejected for now because it would add extra approvals and confirmation flows without improving the product model.
