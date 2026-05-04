# Smart Contracts

useContent uses two smart contract managers:

- `SubscriptionManager` for reader-to-author subscriptions;
- `PlatformSubscriptionManager` for author-to-platform billing and storage quota payments.

Both contracts are deployed per supported EVM network and discovered by the backend through the deployment registry. Current runtime configuration includes test networks such as Sepolia, Base Sepolia, Optimism Sepolia and Arbitrum Sepolia, plus production-oriented chain ids for Base, Optimism and Arbitrum.

## SubscriptionManager

```mermaid
flowchart TD
    Author["Author"] --> Register["registerPlan / updatePlan"]
    Register --> Plans["plans[planKey]"]
    Reader["Reader"] --> Subscribe["subscribe(planKey)"]
    Reader --> Approve["ERC-20 approve<br/>when token payment is used"]
    Approve --> Subscribe
    Subscribe --> Split["Split payment<br/>80% author / 20% treasury"]
    Split --> PaidUntil["paidUntil[reader][planKey]"]
    PaidUntil --> Event["SubscriptionPaid event"]
    Event --> Backend["Backend receipt confirmation"]
    Backend --> Entitlement["MongoDB entitlement"]
```

The contract supports native token payments and ERC-20 payments. For ERC-20 plans, the reader approves the manager contract before calling `subscribe`. For native token plans, the reader sends `msg.value` with the subscription transaction.

The important contract state is intentionally small: registered plans and `paidUntil` by subscriber and plan key. Rich product state such as comments, access policy names, tier descriptions and content metadata remains off-chain.

## Reader payment verification

```mermaid
sequenceDiagram
    participant UI as Frontend
    participant Wallet
    participant Contract as SubscriptionManager
    participant API as Backend
    participant RPC
    participant DB as MongoDB

    UI->>Wallet: Send subscribe transaction
    Wallet->>Contract: subscribe(planKey)
    Contract-->>RPC: SubscriptionPaid event
    UI->>API: Confirm transaction hash
    API->>RPC: Load receipt
    API->>API: Decode and validate event
    API->>DB: Upsert entitlement
    API-->>UI: Return active subscription state
```

The backend checks the manager address, subscriber wallet, plan key, token, amount and paid-until value before updating MongoDB.

## PlatformSubscriptionManager

```mermaid
flowchart TD
    Owner["Platform owner"] --> Tiers["Register/update platform tiers"]
    Author["Author"] --> Choose["Choose tier and extra storage"]
    Choose --> Approve["Approve payment token"]
    Approve --> Subscribe["subscribe(tierKey, extraStorageGb)"]
    Subscribe --> Treasury["Transfer amount to treasury"]
    Subscribe --> Event["PlatformSubscriptionPaid event"]
    Event --> Backend["Backend confirmation"]
    Backend --> Billing["Author platform subscription<br/>quota and features"]
```

This contract does not split revenue with creators. It represents author-to-platform billing: plan tier, extra storage and paid-until state.

## Contract responsibilities

<div class="doc-grid compact">
    <div class="doc-copy-card">
        <p><strong>SubscriptionManager</strong><br>Reader pays an author plan. The contract stores plan data and paid-until state, splits payment between author and platform treasury, and emits <code>SubscriptionPaid</code>.</p>
    </div>
    <div class="doc-copy-card">
        <p><strong>PlatformSubscriptionManager</strong><br>Author pays the platform for a tier and extra storage. The contract transfers the full amount to the treasury and emits <code>PlatformSubscriptionPaid</code>.</p>
    </div>
</div>

## Native vs ERC-20 payments

| Payment type | User action | Contract behavior |
| --- | --- | --- |
| Native token | Call payable `subscribe` with `msg.value` | Contract validates the sent value and transfers native funds. |
| ERC-20 token | Approve manager, then call `subscribe` | Contract uses `transferFrom` to move tokens. |

Reader subscription plans may accept native token or ERC-20 payments depending on the author configuration. Platform billing v1 uses ERC-20 payment flow because author billing needs predictable pricing semantics for tiers and extra storage.

## Backend confirmation rules

The backend validates contract events before updating MongoDB. It checks:

- manager address from the deployment registry;
- subscriber or author wallet;
- plan key or platform tier key;
- token address and amount;
- chain id and transaction hash idempotency;
- paid-until timestamp emitted by the contract.

This makes MongoDB an operational projection of verified on-chain events rather than a source of payment truth.

## Deployment

Contracts are deployed through manual GitHub Actions workflows. This keeps private deploy keys and RPC configuration outside runtime application containers.

The deployed manager addresses are synced to the backend registry so the application can resolve the active manager per chain.
