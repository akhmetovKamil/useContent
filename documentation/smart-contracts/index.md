# Smart Contracts

useContent uses two smart contract managers:

- `SubscriptionManager` for reader-to-author subscriptions;
- `PlatformSubscriptionManager` for author-to-platform billing and storage quota payments.

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

## Deployment

Contracts are deployed through manual GitHub Actions workflows. This keeps private deploy keys and RPC configuration outside runtime application containers.

