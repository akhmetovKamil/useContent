# Access Control

Access control is policy-based. Authors create reusable access policies and attach them to posts or projects. A policy can be public, a single condition, an AND group, or an OR group.

## Access policy flow

```mermaid
sequenceDiagram
    actor Reader
    participant UI as Frontend
    participant API as Backend API
    participant Access as Access service
    participant DB as MongoDB
    participant RPC as EVM RPC
    participant Storage as MinIO

    Reader->>UI: Open locked post or project
    UI->>API: Request content DTO
    API->>Access: Evaluate policy
    Access->>DB: Load policy, plans, entitlements
    Access->>RPC: Read token or NFT state when required
    Access-->>API: Return access decision
    alt Access granted
        API->>Storage: Create signed URL when file is requested
        API-->>UI: Return full content or download URL
    else Access denied
        API-->>UI: Return locked preview and required tier details
    end
```

## Why backend verification is required

The frontend can hide locked content, but it is not a security boundary. The backend must evaluate every protected request because direct API calls or modified clients could otherwise bypass UI-only checks.

The access context includes:

- authenticated wallet address;
- active subscription entitlements;
- policy tree attached to the content;
- token balance or NFT ownership checks;
- content status and author ownership.

## Condition evaluation model

```mermaid
flowchart TD
    Request["Content request"] --> Policy["Load attached policy"]
    Policy --> Public{"Public?"}
    Public -- "yes" --> Granted["Access granted"]
    Public -- "no" --> Mode{"Mode"}
    Mode -- "single" --> One["Evaluate one condition"]
    Mode -- "and" --> All["Evaluate all children"]
    Mode -- "or" --> Any["Evaluate any child"]
    One --> Result["Decision"]
    All --> Result
    Any --> Result
    Result -- "passed" --> Granted
    Result -- "failed" --> Locked["Locked preview"]
```

Subscription conditions are resolved from MongoDB entitlements. Token and NFT conditions may require RPC reads. The resulting response is enriched so the frontend can show which exact condition is missing.

## Policy examples

| Mode | Meaning |
| --- | --- |
| Public | Content is visible without wallet access checks. |
| Single | One condition must be satisfied. |
| AND | All child conditions must be satisfied. |
| OR | At least one child condition must be satisfied. |

## Why access policies are reusable

Authors attach policies to many posts/projects instead of configuring payment rules on every content item. This makes the product easier to maintain: a creator can update a tier and reuse the same policy across multiple pieces of content.
