# Backend Operations

The backend is deployed as a Docker image built by GitHub Actions. Coolify pulls and runs that image with the rest of the runtime stack.

## Request path

```mermaid
sequenceDiagram
    participant Browser
    participant Frontend as Frontend SPA
    participant API as Encore API
    participant Service as Domain service
    participant DB as MongoDB
    participant Storage as MinIO
    participant RPC as EVM RPC

    Browser->>Frontend: User action
    Frontend->>API: HTTP request with JWT when needed
    API->>Service: Route handler
    Service->>DB: Read/write metadata
    Service->>Storage: Upload/download object when needed
    Service->>RPC: Verify chain state when needed
    Service-->>API: DTO or API error
    API-->>Frontend: Response
```

## Deployment registry

Reader and platform manager addresses are stored through a backend deployment registry. Hardhat deployment scripts sync contract addresses after a successful manual workflow. Runtime services then load manager addresses by chain instead of requiring redeploy-time frontend constants.

## Object storage operations

MinIO is used through the backend storage layer. This gives the backend one place to manage:

- object key generation;
- upload and delete calls;
- signed download URLs;
- folder bundle creation;
- storage cleanup support.

## Failure handling

Important failure cases are represented as API errors rather than raw exceptions:

- unauthenticated session;
- missing author profile;
- invalid access policy input;
- missing contract deployment;
- failed transaction verification;
- storage quota exceeded;
- feature unavailable on the current platform plan.

