# Domain Model

The database model is centered around author-owned content, reusable access policies and subscription-derived entitlements.

```mermaid
erDiagram
    USER_PROFILE ||--o| AUTHOR_PROFILE : "can become"
    AUTHOR_PROFILE ||--o{ ACCESS_POLICY : owns
    AUTHOR_PROFILE ||--o{ SUBSCRIPTION_PLAN : owns
    AUTHOR_PROFILE ||--o{ POST : publishes
    AUTHOR_PROFILE ||--o{ PROJECT : publishes
    AUTHOR_PROFILE ||--o{ PLATFORM_SUBSCRIPTION : has

    ACCESS_POLICY ||--o{ POST : gates
    ACCESS_POLICY ||--o{ PROJECT : gates
    SUBSCRIPTION_PLAN ||--o{ ENTITLEMENT : grants
    POST ||--o{ POST_ATTACHMENT : embeds
    POST ||--o{ POST_COMMENT : has
    POST ||--o{ POST_REPORT : receives
    PROJECT ||--o{ PROJECT_NODE : contains

    USER_PROFILE {
        ObjectId _id
        string primaryWallet
        string username
        string displayName
        Date createdAt
    }

    AUTHOR_PROFILE {
        ObjectId _id
        ObjectId userId
        string walletAddress
        string slug
        string displayName
        string[] tags
        Date deletedAt
    }

    ACCESS_POLICY {
        ObjectId _id
        ObjectId authorId
        string name
        boolean isDefault
        object policyInput
    }

    SUBSCRIPTION_PLAN {
        ObjectId _id
        ObjectId authorId
        string code
        string planKey
        number chainId
        string tokenAddress
        string amount
    }

    ENTITLEMENT {
        ObjectId _id
        string subscriberWallet
        ObjectId authorId
        string planCode
        string txHash
        Date validUntil
    }

    POST {
        ObjectId _id
        ObjectId authorId
        string status
        ObjectId accessPolicyId
        number likesCount
        number commentsCount
        Date publishedAt
    }

    PROJECT {
        ObjectId _id
        ObjectId authorId
        string status
        ObjectId accessPolicyId
        number totalSize
    }

    PROJECT_NODE {
        ObjectId _id
        ObjectId projectId
        ObjectId parentId
        string type
        number size
    }
```

## Separation of concerns

MongoDB contains documents and access state. MinIO contains the actual file bytes. Smart contracts contain payment state and emit events, but the backend mirrors successful payments into MongoDB entitlements for fast access evaluation.

For a deeper storage-focused view, see [Storage Model](./storage) and [MongoDB Collections](./mongodb).

## Content state model

```mermaid
stateDiagram-v2
    direction LR
    [*] --> draft
    draft --> published: publish
    draft --> archived: archive
    published --> archived: archive
    archived --> draft: restore draft
    archived --> published: restore publish
```

Draft content is author-only. Published content can appear in feeds if the access policy allows it. Archived content is hidden from reader feeds and ordinary author lists.

## Entitlement model

Entitlements are the backend projection of successful reader subscription payments. The contract remains the payment source of truth, but the backend stores the access-friendly state:

- subscriber wallet;
- author;
- plan code and plan key;
- chain and transaction hash;
- valid-until date.

This lets access evaluation avoid scanning historical chain events on every content request.

## Platform billing model

Platform billing is author-facing. It tracks the current plan, storage quota, grace state and extra storage. Upload checks compare metadata-based usage with the current quota before accepting new files.
