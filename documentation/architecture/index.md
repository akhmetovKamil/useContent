# High-Level Architecture

useContent is organized around a static frontend, an Encore.ts backend, MongoDB metadata, MinIO object storage and EVM smart contracts. The backend is the security boundary for protected content: it verifies sessions, evaluates access policies, confirms blockchain events and issues signed file URLs only when access is valid.

```mermaid
flowchart LR
    subgraph Client["Client environment"]
        Reader["Reader / Author"]
        Browser["Browser"]
        Wallet["EVM wallet"]
    end

    subgraph Web["Web application"]
        Frontend["Frontend SPA<br/>React + Vite"]
        Docs["VitePress docs<br/>static site"]
    end

    subgraph Backend["Server environment"]
        API["Encore.ts API<br/>domain services"]
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
        Nginx["nginx frontend container"]
    end

    Reader --> Browser
    Browser --> Frontend
    Browser --> Docs
    Frontend --> API
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
    GitHub --> Coolify
    Coolify --> Nginx
    Nginx --> Frontend
```

## Service boundaries

The backend is split into domain services: profiles, access, subscriptions, platform billing, posts, projects, activity, authentication, storage and on-chain helpers. This keeps the access model, payment confirmation and file tree logic separated instead of centralizing all behavior in a single content module.

