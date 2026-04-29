# ADR-005: Separate Platform Billing Manager

## Context

Reader subscriptions and author platform billing represent different payment relationships.

## Decision

useContent uses `PlatformSubscriptionManager` for author-to-platform billing instead of mixing this flow into `SubscriptionManager`.

## Consequences

- Reader-to-author revenue split remains isolated.
- Platform billing can manage tier and extra storage as one author checkout.
- Backend confirmation updates author quota and features separately from reader entitlements.

## Alternatives considered

Reusing `SubscriptionManager` for platform billing was rejected because it would mix different payment semantics.

