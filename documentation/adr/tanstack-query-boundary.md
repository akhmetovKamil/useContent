# ADR-008: TanStack Query as Frontend Server-State Boundary

## Context

The frontend contains many server-driven screens: feeds, author profiles, access tiers, subscriptions, comments, activity, project trees and platform billing. Without a clear boundary, pages would duplicate loading states, cache invalidation and response shaping.

## Decision

TanStack Query is used as the frontend server-state boundary. Pages call domain hooks instead of Axios directly. API classes stay thin and typed, while hooks own query keys, pagination helpers, optimistic updates and invalidation rules.

## Consequences

- Pages become orchestration/layout code rather than transport code.
- Infinite feeds can share pagination behavior.
- Mutations can invalidate related domains consistently.
- Session reset can clear protected query state when the backend returns `401`.
- Client-only state remains local or in small stores instead of being mixed with server cache.

## Alternatives considered

Manual `useEffect` fetching was rejected because it spreads loading/error/cache logic across pages. A large global store for server data was rejected because it would duplicate behavior that TanStack Query already provides.

