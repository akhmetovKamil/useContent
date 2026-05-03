# High-Level Architecture

useContent is organized around a static frontend, an Encore.ts backend, MongoDB metadata, MinIO object storage and EVM smart contracts. Production traffic enters through the Coolify proxy, which terminates HTTPS for `usecontent.app`, `api.usecontent.app` and `docs.usecontent.app`. The backend is the security boundary for protected content: it verifies sessions, evaluates access policies, confirms blockchain events and issues signed file URLs only when access is valid.

```mermaid
flowchart LR
    subgraph Client["Client environment"]
        Reader["Reader / Author"]
        Browser["Browser"]
        Wallet["EVM wallet"]
    end

    subgraph Edge["Public HTTPS edge"]
        Proxy["Coolify proxy<br/>Let's Encrypt TLS"]
        AppDomain["usecontent.app"]
        ApiDomain["api.usecontent.app"]
        DocsDomain["docs.usecontent.app"]
    end

    subgraph Web["Web resources"]
        Frontend["Frontend SPA<br/>React + Vite + nginx"]
        Docs["VitePress docs<br/>Coolify Static App"]
    end

    subgraph Backend["Server environment"]
        API["Encore.ts API<br/>domain services<br/>internal :8080"]
        Mongo[("MongoDB<br/>metadata")]
        MinIO[("MinIO<br/>object storage")]
    end

    subgraph Chain["EVM networks"]
        RPC["RPC provider"]
        ReaderManager["SubscriptionManager"]
        PlatformManager["PlatformSubscriptionManager"]
        ERC20["ERC-20 tokens"]
    end

    subgraph Ops["Operations"]
        GitHub["GitHub Actions"]
        Coolify["Coolify"]
        GHCR["GHCR<br/>backend image"]
    end

    Reader --> Browser
    Browser --> Proxy
    Proxy --> AppDomain --> Frontend
    Proxy --> ApiDomain --> API
    Proxy --> DocsDomain --> Docs
    Frontend --> ApiDomain
    Frontend --> Wallet
    Wallet --> RPC
    Frontend --> RPC
    API --> Mongo
    API --> MinIO
    API --> RPC
    RPC --> ReaderManager
    RPC --> PlatformManager
    ReaderManager --> ERC20
    PlatformManager --> ERC20
    GitHub --> GHCR
    GitHub --> Coolify
    Coolify --> Frontend
    Coolify --> Docs
    GHCR -.-> API
```

## Service boundaries

The backend is split into domain services: profiles, access, subscriptions, platform billing, posts, projects, activity, authentication, storage and on-chain helpers. This keeps the access model, payment confirmation and file tree logic separated instead of centralizing all behavior in a single content module.

## Runtime responsibility map

| Area | Owner in the system | Why |
| --- | --- | --- |
| Session state | Frontend + auth service | Frontend stores the JWT metadata, backend verifies the token. |
| Access decisions | Backend access layer | The frontend cannot be trusted to protect data by itself. |
| Payment execution | Wallet + smart contract | The user signs transactions and the contract enforces payment logic. |
| Payment confirmation | Backend on-chain layer | Receipts and events are decoded through RPC before MongoDB state changes. |
| File bytes | MinIO | Binary objects are kept outside MongoDB. |
| File visibility | Backend + signed URLs | A MinIO object is only exposed after access evaluation. |

## Why the architecture is hybrid

The platform deliberately avoids putting content metadata and files on-chain. Blockchain operations are used where they add strong payment proof: subscriptions, paid-until extension and treasury transfers. Product behavior such as feeds, comments, access policy composition, file trees and activity remains in the backend/database layer, where it can evolve without contract migrations.
