# ADR-004: Shared Manager Contract for Reader Subscriptions

## Context

Authors need subscription plans, but deploying a separate contract per author or per plan would make the UX expensive and operationally heavy.

## Decision

useContent uses one `SubscriptionManager` contract per supported EVM network. Authors register plans inside the shared manager.

Plan identity is represented by a `planKey`, and backend confirmation validates events against the manager address stored for that chain.

## Consequences

- Authors do not deploy their own contracts.
- Backend can track one manager address per chain.
- Plan identity is represented by `planKey`.
- Reader payments emit events that the backend confirms and mirrors into MongoDB entitlements.
- A single deployment registry record per network is enough for reader subscription confirmation.
- Frontend subscription UI can use the same contract integration shape across authors.

## Alternatives considered

Per-author contracts were rejected because they add deployment cost and operational complexity. Pure backend subscriptions were rejected because the product goal includes wallet-native payment proof.
