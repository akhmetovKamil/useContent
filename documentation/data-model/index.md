# Data Model

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

