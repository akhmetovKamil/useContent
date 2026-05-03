# Frontend Data Flow

The frontend is a static React application, but most screens depend on server state. TanStack Query is the main coordination layer between UI components, API classes and backend responses.

<div class="doc-grid">
    <div class="doc-card">
        <span class="doc-badge">Cache</span>
        <strong>TanStack Query</strong>
        <span>Owns server state, pagination, loading states and refetch behavior.</span>
    </div>
    <div class="doc-card">
        <span class="doc-badge">HTTP</span>
        <strong>Typed API layer</strong>
        <span>Keeps pages away from raw Axios calls and response object shapes.</span>
    </div>
    <div class="doc-card">
        <span class="doc-badge">Session</span>
        <strong>Auth store</strong>
        <span>Tracks wallet address, JWT token and expiration metadata.</span>
    </div>
</div>

<details class="doc-flow-card" open>
<summary>Query lifecycle</summary>

```mermaid
flowchart TD
    Page["Page component"] --> Hook["Domain query hook"]
    Hook --> Query["TanStack Query cache"]
    Query --> API["Typed API class"]
    API --> HTTP["Axios HTTP client"]
    HTTP --> Backend["Encore API"]
    Backend --> HTTP
    HTTP --> API
    API --> Query
    Query --> Hook
    Hook --> Page
```

Pages do not call Axios directly. They use domain query hooks that return already shaped data such as feed items, loading states, pagination helpers and mutation actions.

</details>

<details class="doc-flow-card">
<summary>Mutation and invalidation</summary>

```mermaid
sequenceDiagram
    participant UI as UI component
    participant Mutation as Mutation hook
    participant API as API class
    participant Cache as Query cache
    participant Backend as Backend

    UI->>Mutation: User action
    Mutation->>Cache: Optional optimistic update
    Mutation->>API: Send request
    API->>Backend: HTTP mutation
    Backend-->>API: Updated DTO
    API-->>Mutation: Result
    Mutation->>Cache: Invalidate related queries
    Cache-->>UI: Re-render with fresh data
```

This pattern is used for actions such as likes, comments, post archive/restore, subscription confirmation, author profile updates and billing updates.

</details>

## Session-aware requests

The Axios layer attaches the current JWT when a protected request is made. If the backend returns an unauthenticated response, the frontend clears the stored session and keeps public pages usable. This prevents the UI from showing an old wallet session as active after the token expires.

<details class="doc-flow-card">
<summary>Web3 request flow</summary>

Web3 operations are not treated as normal HTTP requests. The frontend first uses wagmi/viem to read wallet, chain and contract state. Once a transaction is confirmed by the wallet, the backend receives the transaction hash and validates the event through RPC.

```mermaid
flowchart LR
    UI["Subscribe button"] --> Wallet["Wallet confirmation"]
    Wallet --> Contract["Smart contract transaction"]
    Contract --> TxHash["Transaction hash"]
    TxHash --> Backend["Backend confirm endpoint"]
    Backend --> RPC["RPC receipt lookup"]
    RPC --> Event["Decoded event"]
    Event --> Cache["Invalidate query cache"]
```

The UI does not assume that a transaction hash is enough. Access is updated only after backend confirmation succeeds.

</details>
