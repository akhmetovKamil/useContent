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

| State type | Tool | Examples |
| --- | --- | --- |
| Server cache | TanStack Query | feeds, author profiles, access tiers, billing state, activity |
| Mutations | TanStack Query | sign in, create post, subscribe, upload file, archive post |
| Wallet/session state | Zustand + wagmi | JWT metadata, wallet address, connection state |
| Form state | React hooks + validation schemas | onboarding, access policy editor, post composer |
| Derived display state | Pure utilities | prices, dates, file sizes, explorer links |

## API layer

The API layer wraps Axios and returns typed DTOs. Request params and response shapes are centralized to avoid inline object contracts inside pages.

The important rule is that pages do not know transport details. A page asks a domain hook for `items`, `loadMore`, `isLoading`, `error` and mutation actions. The hook decides which query key to use, which API class to call and which related queries must be invalidated after a mutation.

## Web3 integration

wagmi and viem are used for:

- wallet connection;
- contract reads;
- ERC-20 allowance checks;
- approve transactions;
- subscription transactions;
- transaction status handling.

The UI never grants access immediately after `writeContract`. It waits for backend confirmation of the transaction receipt. This prevents a pending, reverted or unrelated transaction hash from becoming access state in the product.

## Page composition

The frontend avoids turning pages into large UI components. Pages usually coordinate queries, route state and high-level layout. Domain folders then render the actual interface:

- public author pages use access tier cards, tier drawers and post feed components;
- author workspace pages reuse content manager, post composer and project tree components;
- billing pages use storage/quota panels and checkout drawers;
- feed pages reuse the same post card structure across home, subscription feed and author pages.

This structure makes it possible to change cards, fields or action buttons in one place instead of editing similar markup across many pages.

## UI structure

Large pages are decomposed into page-specific component folders. Shared visual primitives live in `components/common`, while domain-specific components stay close to their domain folders.

See [Frontend Data Flow](./data-flow) for the detailed request/cache/mutation flow.

## Error and validation model

The frontend separates three kinds of failure. Query failures render inline states, user-triggered mutation failures use toast notifications, and invalid form input is shown near the affected field. Validation schemas are written with Zod for important forms such as author onboarding, reports, comments and content forms.
