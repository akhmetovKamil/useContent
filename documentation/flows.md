# Runtime Flows

Runtime flows describe how user actions cross the frontend, backend, object storage and smart contracts. Wallet login has a dedicated page, so this section focuses on the product flows that combine several subsystems.

<div class="doc-diagram-note">
<p><strong>Flow rule.</strong> The frontend initiates user interactions, but access decisions, storage commits and payment confirmation are finalized on the backend.</p>
</div>

<details class="doc-flow-card" open>
<summary>File upload flow</summary>

```mermaid
sequenceDiagram
    actor Author
    participant UI as Frontend
    participant API as Backend API
    participant Quota as Platform quota
    participant Storage as MinIO
    participant DB as MongoDB

    Author->>UI: Select post or project files
    UI->>API: Upload multipart payload
    API->>Quota: Check author plan and remaining bytes
    alt quota available
        API->>Storage: Store object by author-scoped key
        API->>DB: Persist attachment or project node metadata
        API-->>UI: Return updated content DTO
    else quota exceeded
        API-->>UI: Return quota error
    end
```

The upload path is backend-mediated because quota, author ownership, project tree consistency and object keys must be validated before bytes become visible to readers.

</details>

<details class="doc-flow-card">
<summary>Reader subscription flow</summary>

```mermaid
sequenceDiagram
    actor Reader
    participant UI as Access tier drawer
    participant Wallet
    participant Manager as SubscriptionManager
    participant API as Backend API
    participant RPC
    participant DB as MongoDB

    Reader->>UI: Unlock tier
    UI->>Wallet: Approve ERC-20 if required
    Wallet->>Manager: approve(manager, amount)
    UI->>Wallet: Request subscribe transaction
    Wallet->>Manager: subscribe(planKey)
    Manager-->>RPC: SubscriptionPaid event
    UI->>API: Confirm transaction hash
    API->>RPC: Fetch receipt and decode event
    API->>DB: Upsert entitlement with paidUntil
    API-->>UI: Return refreshed access state
```

The UI never treats a transaction hash as final access. The backend confirms the emitted event, validates the manager address, subscriber wallet, plan key and amount, and only then updates the entitlement projection in MongoDB.

</details>

<details class="doc-flow-card">
<summary>Author platform billing flow</summary>

```mermaid
sequenceDiagram
    actor Author
    participant UI as Billing page
    participant Wallet
    participant Manager as PlatformSubscriptionManager
    participant API as Backend API
    participant RPC
    participant DB as MongoDB

    Author->>UI: Select Basic plan and extra storage
    UI->>API: Create payment intent
    UI->>Wallet: Approve USDC allowance
    Wallet->>Manager: approve(manager, amount)
    UI->>Wallet: Confirm platform subscribe
    Wallet->>Manager: subscribe(tierKey, extraStorageGb)
    Manager-->>RPC: PlatformSubscriptionPaid event
    UI->>API: Confirm platform payment
    API->>RPC: Verify event fields
    API->>DB: Update quota, features and validUntil
```

This flow is separate from reader subscriptions because the payer, receiver and backend projection are different. Reader payments create entitlements; author platform billing changes storage quota and feature gates.

</details>

<details class="doc-flow-card">
<summary>Promoted feed flow</summary>

```mermaid
flowchart TD
    Author["Basic author"] --> Promote["Enable promotion on published post"]
    Promote --> FeatureGate["Backend checks homepage_promo feature"]
    FeatureGate --> PostState["Store promotion state on post"]
    Reader["Reader opens home feed"] --> Feed["Hybrid feed query"]
    Feed --> Rank["Dedupe + ranking boost"]
    PostState --> Rank
    Rank --> UI["PostCard with promoted badge"]
```

Promotion is currently a platform-plan feature, not a separate advertising auction. The backend still keeps it explicit so it can later evolve into slots, budgets or moderation workflows.

</details>
