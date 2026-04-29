# Wallet Authentication

useContent authenticates users through wallet signatures. The wallet proves ownership of an address by signing a backend nonce. The backend then issues a JWT session.

```mermaid
sequenceDiagram
    actor User
    participant UI as Frontend
    participant Wallet
    participant API as Auth API
    participant DB as MongoDB

    User->>UI: Connect wallet
    UI->>API: Request nonce for wallet
    API->>DB: Store nonce challenge
    API-->>UI: Return nonce message
    UI->>Wallet: Request signature
    Wallet-->>UI: Signature
    UI->>API: Verify signature
    API->>API: Recover signer address
    API->>DB: Create or update user profile
    API-->>UI: Return JWT and expiresAt
```

The frontend stores session metadata: token, wallet address, authentication time and expiration time. If the connected wallet changes or the token expires, the session is cleared and the user must sign a new nonce.

