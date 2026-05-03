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

## Session lifetime

The JWT session is intentionally time-limited. A persisted wallet connection is not treated as a valid application session by itself: the frontend checks the stored `expiresAt` value on startup and asks for a new signature when the session is stale.

This keeps the UX wallet-native without adding refresh tokens. The user signs a nonce again when the session expires, disconnects, switches accounts or receives an unauthenticated backend response.

## Account switching

```mermaid
flowchart TD
    Connected["Wallet connected"] --> Compare{"Wallet matches<br/>stored session?"}
    Compare -- "yes" --> Active["Session active"]
    Compare -- "no" --> Clear["Clear JWT and protected cache"]
    Clear --> Required["Signature required"]
    Active --> Request["Protected request"]
    Request --> Expired{"Backend returns 401?"}
    Expired -- "yes" --> Clear
    Expired -- "no" --> Continue["Continue"]
```

The frontend keeps public pages available after session reset. Only protected mutations and private workspace data require signing again.
