# Backend Operations

The backend is deployed as a Docker image built by GitHub Actions. Coolify runs that image behind the proxy together with MongoDB and MinIO. Operationally, the backend is responsible for request validation, domain orchestration, storage safety and on-chain event verification.

## Request flow

```mermaid
sequenceDiagram
    participant Browser
    participant Proxy as Coolify proxy
    participant API as Encore API gateway
    participant Service as Domain service
    participant DB as MongoDB
    participant Storage as MinIO
    participant RPC as EVM RPC

    Browser->>Proxy: HTTPS request to api.usecontent.app
    Proxy->>API: Internal HTTP to backend :8080
    API->>Service: Authenticated route handler
    Service->>DB: Read/write metadata
    Service->>Storage: Store object or create signed URL when needed
    Service->>RPC: Verify chain state when needed
    Service-->>API: DTO or API error
    API-->>Browser: Normalized response
```

## Deployment registry flow

Reader and platform manager addresses are stored through a backend deployment registry. Hardhat deployment scripts sync contract addresses after a successful manual workflow. Runtime services then load manager addresses by chain instead of requiring hard-coded frontend constants.

```mermaid
sequenceDiagram
    participant Workflow as GitHub Actions manual workflow
    participant Hardhat
    participant Chain as EVM network
    participant API as Backend registry endpoint
    participant DB as MongoDB
    participant Runtime as Subscription services

    Workflow->>Hardhat: Run deploy script
    Hardhat->>Chain: Deploy manager contract
    Hardhat->>API: Sync chain id + manager address
    API->>DB: Store deployment record
    Runtime->>DB: Resolve manager during payment confirmation
```

## Object storage operations

MinIO is used through the backend storage layer. This gives the backend one place to manage object key generation, upload/delete calls, signed download URLs, folder bundle creation and storage cleanup support.

```mermaid
flowchart TD
    Domain["Posts / Projects service"] --> StorageLayer["Storage infrastructure"]
    StorageLayer --> Put["putObject"]
    StorageLayer --> Signed["signed GET URL"]
    StorageLayer --> Delete["deleteObject"]
    StorageLayer --> Bundle["folder bundle"]
    Put --> MinIO["MinIO bucket"]
    Signed --> MinIO
    Delete --> MinIO
    Bundle --> MinIO
```

## Failure taxonomy

Backend failures are represented as API errors instead of leaking raw exceptions to the frontend.

| Failure | Typical response | UI behavior |
| --- | --- | --- |
| Expired session | `unauthenticated` | Clear session and ask for wallet signature. |
| Invalid form input | `invalid_argument` | Show field-level validation or inline message. |
| Missing author/content | `not_found` | Show empty or not-found state. |
| Missing plan/feature | `failed_precondition` | Show upgrade or plan-required state. |
| Storage quota exceeded | `failed_precondition` | Block upload and show quota message. |
| Contract verification failed | `invalid_argument` / `failed_precondition` | Keep access locked and show transaction error. |

The frontend then decides how to display those failures: inline query states for page loads, toasts for user actions and field errors for validation.

