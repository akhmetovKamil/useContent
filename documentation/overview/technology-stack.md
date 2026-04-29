# Technology Stack

| Layer | Technology | Purpose |
| --- | --- | --- |
| Frontend | React, Vite, TypeScript | Static SPA for reader and author workspaces. |
| UI | Tailwind CSS, shadcn-style components, Magic UI components | Application layout, forms, cards, drawers and interaction polish. |
| Data fetching | TanStack Query, Axios | Query caching, mutation invalidation and typed API requests. |
| Web3 frontend | wagmi, viem | Wallet connection, contract reads, contract writes and transaction handling. |
| Backend | Encore.ts, TypeScript | Domain services, authentication, API routing and infrastructure integration. |
| Database | MongoDB | Profiles, posts, projects, policies, subscriptions, entitlements and activity. |
| Object storage | MinIO | Post attachments and project file objects. |
| Smart contracts | Solidity, Hardhat | Subscription managers, deployment scripts and contract tests. |
| Deployment | Docker, nginx, GitHub Actions, Coolify | Application container build, runtime orchestration and manual contract deployment. |
| Documentation | VitePress, Mermaid | Static documentation portal and architecture diagrams. |

## Shared contracts

The repository contains a `shared` package with DTOs, constants, ABI exports and pure web3 helpers used by both frontend and backend. This reduces drift between API responses, frontend views and backend service contracts.

