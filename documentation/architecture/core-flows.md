# Core Flows

This section summarizes the main runtime flows that connect frontend, backend, object storage and smart contracts.

## Wallet authentication flow

```mermaid
sequenceDiagram
    actor User
    participant UI as Frontend
    participant Query as TanStack Query
    participant Wallet
    participant API as Auth API
    participant Store as Auth store

    User->>UI: Connect wallet
    UI->>Query: Request nonce mutation
    Query->>API: POST nonce request
    API-->>Query: Nonce message
    Query->>Wallet: Ask user to sign
    Wallet-->>Query: Signature
    Query->>API: Verify signature
    API-->>Store: JWT, wallet address, expiresAt
    Store-->>UI: Session active
```

## File upload flow

```mermaid
sequenceDiagram
    actor Author
    participant UI as Frontend
    participant API as Backend API
    participant DB as MongoDB
    participant Storage as MinIO

    Author->>UI: Select post/project files
    UI->>API: Upload metadata and file payload
    API->>API: Validate author session and quota
    API->>Storage: Store object by author-scoped key
    API->>DB: Persist attachment or project node metadata
    API-->>UI: Return updated content DTO
```

The upload flow is intentionally backend-mediated. The frontend does not write directly into MinIO because quota checks, author ownership and project/post metadata must be committed consistently.

## Reader subscription flow

```mermaid
sequenceDiagram
    actor Reader
    participant UI as Frontend
    participant Wallet
    participant Manager as SubscriptionManager
    participant API as Backend API
    participant DB as MongoDB
    participant RPC

    Reader->>UI: Unlock tier
    UI->>Wallet: Request approve if ERC-20
    Wallet->>Manager: approve(manager, amount)
    UI->>Wallet: Request subscribe transaction
    Wallet->>Manager: subscribe(planKey)
    Manager-->>RPC: Emit SubscriptionPaid
    UI->>API: Confirm tx hash
    API->>RPC: Fetch receipt and decode event
    API->>DB: Upsert entitlement with paidUntil
    API-->>UI: Return active access state
```

TanStack Query invalidates author tiers, posts, projects and reader subscription state after confirmation. This keeps the UI in sync without requiring a full page reload.

## Author platform billing flow

```mermaid
sequenceDiagram
    actor Author
    participant UI as Billing page
    participant Wallet
    participant Manager as PlatformSubscriptionManager
    participant API as Backend API
    participant DB as MongoDB
    participant RPC

    Author->>UI: Select Basic plan and extra storage
    UI->>Wallet: Request ERC-20 approve
    Wallet->>Manager: approve(manager, amount)
    UI->>Wallet: Request platform subscribe
    Wallet->>Manager: subscribe(tierKey, extraStorageGb)
    Manager-->>RPC: Emit PlatformSubscriptionPaid
    UI->>API: Confirm platform payment
    API->>RPC: Verify receipt event
    API->>DB: Update author platform subscription and quota
    API-->>UI: Return billing state
```

Author platform billing uses a different manager contract because the money flow is author-to-platform, not reader-to-author. The backend updates quota and feature availability after receipt verification.
