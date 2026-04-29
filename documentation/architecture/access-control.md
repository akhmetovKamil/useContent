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

## Policy examples

| Mode | Meaning |
| --- | --- |
| Public | Content is visible without wallet access checks. |
| Single | One condition must be satisfied. |
| AND | All child conditions must be satisfied. |
| OR | At least one child condition must be satisfied. |

