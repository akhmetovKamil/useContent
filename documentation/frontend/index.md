# Frontend Architecture

The frontend is a React SPA built with Vite. It is served as static files and communicates with the backend through typed API classes.

```mermaid
flowchart TD
    App["App providers<br/>QueryClient, Wagmi, Router"]
    Pages["Pages<br/>Home, Author, Billing, Posts"]
    Components["Domain components<br/>PostCard, AccessTier, ProjectTree"]
    Common["Common UI primitives<br/>Field, MetricCard, IconAction"]
    Queries["TanStack Query hooks"]
    API["Typed API classes"]
    HTTP["Axios HTTP client"]
    Stores["Zustand stores<br/>auth/session"]
    Web3["wagmi / viem helpers"]
    Shared["shared DTOs, constants, ABI"]

    App --> Pages
    Pages --> Components
    Components --> Common
    Pages --> Queries
    Queries --> API
    API --> HTTP
    Pages --> Stores
    Components --> Web3
    Web3 --> Shared
    API --> Shared
```

## State management

Server state is handled by TanStack Query. Local session state is stored in Zustand. Component-local form state is kept in React components and custom hooks unless it must be shared globally.

## API layer

The API layer wraps Axios and returns typed DTOs. Request params and response shapes are centralized to avoid inline object contracts inside pages.

## Web3 integration

wagmi and viem are used for:

- wallet connection;
- contract reads;
- ERC-20 allowance checks;
- approve transactions;
- subscription transactions;
- transaction status handling.

## UI structure

Large pages are decomposed into page-specific component folders. Shared visual primitives live in `components/common`, while domain-specific components stay close to their domain folders.

