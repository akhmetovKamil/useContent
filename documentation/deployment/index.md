# Deployment

The runtime application and the documentation portal are deployed separately.

<div class="doc-grid">
    <a class="doc-card" href="#application-deployment">
        <span class="doc-badge">Runtime</span>
        <strong>Application stack</strong>
        <span>Frontend nginx container, backend image, MongoDB and MinIO.</span>
    </a>
    <a class="doc-card" href="#contract-deployment">
        <span class="doc-badge">Contracts</span>
        <strong>Manual workflows</strong>
        <span>Hardhat deployment jobs with private keys scoped to GitHub Actions.</span>
    </a>
    <a class="doc-card" href="/deployment/documentation">
        <span class="doc-badge">Docs</span>
        <strong>Static VitePress</strong>
        <span>Coolify Static App with no Dockerfile and no runtime secrets.</span>
    </a>
</div>

```mermaid
flowchart TD
    Push["Push to master"] --> Actions["GitHub Actions"]
    Actions --> BackendImage["Build backend Docker image"]
    BackendImage --> GHCR["Push to GHCR"]
    Actions --> Webhook["Trigger Coolify webhook"]
    Webhook --> Coolify["Coolify"]
    Coolify --> Frontend["Build frontend container<br/>React static files + nginx"]
    Coolify --> Backend["Pull backend image"]
    Coolify --> Mongo["MongoDB container"]
    Coolify --> MinIO["MinIO container"]

    Manual["Manual contract workflow"] --> Hardhat["Hardhat deploy script"]
    Hardhat --> Registry["Backend deployment registry"]
```

## Application deployment

The frontend is built into a static bundle and served through nginx. The backend is built as a Docker image through GitHub Actions and pushed to GitHub Container Registry. Coolify pulls and runs the backend image together with MongoDB and MinIO.

## Runtime containers

| Container | Role |
| --- | --- |
| frontend | Builds React/Vite output and serves it through nginx. |
| backend | Runs the Encore API image from GitHub Container Registry. |
| mongo | Stores application metadata and access state. |
| minio | Stores binary objects for posts and projects. |
| minio-init | Creates the required bucket during startup. |

<div class="doc-diagram-note">
<p><strong>Deployment boundary.</strong> Runtime containers receive only application runtime configuration. Contract deployment secrets live in manual GitHub Actions workflows, not in Coolify containers.</p>
</div>

## CI/CD flow

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant GH as GitHub
    participant Actions as GitHub Actions
    participant Registry as GHCR
    participant Coolify
    participant Server

    Dev->>GH: Push to master
    GH->>Actions: Start workflow
    Actions->>Actions: Build backend image with Encore
    Actions->>Registry: Push versioned and latest tags
    Actions->>Coolify: Trigger deploy webhook
    Coolify->>Registry: Pull backend image
    Coolify->>Server: Recreate runtime services
```

The frontend is built by Coolify from the repository using the frontend Dockerfile. The backend is prebuilt in GitHub Actions because the Encore Docker build is part of the CI workflow.

## Contract deployment

Smart contract deployment is manual. GitHub Actions workflows run Hardhat deployment scripts for selected networks and sync deployed manager addresses into the backend deployment registry.

Manual workflows are used because contract deployment requires private keys and RPC endpoints. Those secrets should be scoped to GitHub Actions and not mounted into the runtime backend or frontend containers.

## Documentation deployment

The VitePress documentation is deployed as a separate Coolify Static App. It does not require Dockerfile or docker-compose configuration.

See [Documentation Deployment](./documentation) for exact Coolify settings.
