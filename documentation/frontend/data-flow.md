# Frontend Data Flow

The frontend is a static React application, but most screens depend on server state: feeds, access tiers, billing state, comments, project trees and session-aware user data. The data flow is built around small domain hooks instead of direct Axios calls from pages.

<div class="doc-grid">
    <a class="doc-card" href="#tanstack-query-lifecycle">
        <span class="doc-badge">Cache</span>
        <strong>TanStack Query</strong>
        <span>Owns server state, pagination, loading states and refetch behavior.</span>
    </a>
    <a class="doc-card" href="#typed-api-layer">
        <span class="doc-badge">HTTP</span>
        <strong>Typed API layer</strong>
        <span>Keeps pages away from raw Axios calls and response object shapes.</span>
    </a>
    <a class="doc-card" href="#session-state">
        <span class="doc-badge">Session</span>
        <strong>Auth store</strong>
        <span>Tracks wallet address, JWT token and expiration metadata.</span>
    </a>
</div>

## TanStack Query lifecycle

```mermaid
flowchart TD
    Page["Page"] --> Hook["Domain query hook"]
    Hook --> Cache{"TanStack Query cache"}
    Cache -->|cache hit| ViewState["Typed view state<br/>items + loading + actions"]
    Cache -->|cache miss / stale| API["Domain API class"]
    API --> HTTP["HTTP client<br/>auth + error normalization"]
    HTTP --> Backend["Encore API"]
    Backend --> HTTP
    HTTP --> API
    API --> Cache
    Cache --> ViewState
    ViewState --> Page
```

Pages consume already-shaped hooks such as feed items, loading flags, pagination helpers and mutation actions. This keeps page components focused on layout instead of response parsing.

## Typed API layer

The API layer wraps Axios with typed helpers for `GET`, `POST`, `PATCH`, uploads and downloads. Query params are serialized centrally, so API classes do not repeat `undefined` checks or inline response wrappers. Shared DTOs define the API contract, while frontend-only types describe local filters, tabs and form state.

## Session state

Protected requests attach the current JWT. The auth store also keeps the connected wallet address, `authenticatedAt` and `expiresAt`. If a request returns `401`, the HTTP layer clears the session and protected query cache while keeping public pages usable.

```mermaid
flowchart TD
    Request["Protected request"] --> Token{"JWT available<br/>and not expired?"}
    Token -- "yes" --> Header["Attach Authorization header"]
    Header --> API["Backend request"]
    API --> Response{"Response"}
    Response -- "success" --> Cache["Update query cache"]
    Response -- "401" --> Clear["Clear auth store<br/>reset protected queries"]
    Token -- "no" --> Sign["Show signature required state"]
```

## Mutation invalidation

```mermaid
sequenceDiagram
    participant UI as UI component
    participant Mutation as Mutation hook
    participant Cache as Query cache
    participant API as API class
    participant Backend

    UI->>Mutation: User action
    Mutation->>Cache: Optimistic update when safe
    Mutation->>API: Send typed request
    API->>Backend: HTTP mutation
    Backend-->>API: Updated DTO
    API-->>Mutation: Result
    Mutation->>Cache: Invalidate related domains
    Cache-->>UI: Re-render with fresh state
```

This pattern is used for likes, comments, post archive/restore, subscription confirmation, author profile updates, reports and platform billing updates.

## Web3 request flow

Web3 operations combine wallet state, contract writes and backend confirmation. The frontend can request a transaction, but access is updated only after the backend verifies the event through RPC.

```mermaid
sequenceDiagram
    participant UI as Frontend
    participant Wallet
    participant Contract as Smart contract
    participant API as Backend confirm endpoint
    participant RPC
    participant Cache as TanStack Query

    UI->>Wallet: Request approve / subscribe
    Wallet->>Contract: Send transaction
    Contract-->>Wallet: Transaction hash
    UI->>API: Confirm tx hash
    API->>RPC: Load receipt and decode event
    API-->>UI: Confirmed access or billing state
    UI->>Cache: Invalidate affected queries
```

The same shape is used for reader subscriptions and author platform billing, but the backend validates different manager contracts and updates different MongoDB projections.
