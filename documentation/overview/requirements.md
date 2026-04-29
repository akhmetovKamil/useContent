# Requirements

## Functional requirements

- Wallet-based authentication through nonce signing.
- Separate reader and author workspaces.
- Author onboarding with profile metadata and slug.
- Post publishing with draft, published and archived states.
- Project publishing with a file/folder tree.
- Reusable access policies for posts and projects.
- Access rules based on public content, subscriptions, token balance and NFT ownership.
- Reader subscriptions paid through native tokens or ERC-20 tokens.
- Backend confirmation of on-chain payment events.
- Author platform billing with storage quota and plan features.
- Protected file access through backend verification and signed URLs.
- Likes, comments, views, reports, activity and feed pages.

## Non-functional requirements

- Access checks must not rely only on frontend visibility.
- Binary files should be stored outside MongoDB.
- Smart contract deployment must be controlled and separate from application container startup.
- The frontend should remain a static SPA that can be served by nginx or static hosting.
- Documentation should be deployable as a standalone static site.
- The system should support multiple EVM networks through configurable RPC endpoints and deployment registry records.

## Security constraints

- A reader cannot download protected files without a valid backend-verified access state.
- JWT sessions expire and stale sessions are cleared on the frontend.
- Smart contract payment confirmation validates receipt logs rather than trusting a user-provided transaction hash.
- Platform and reader subscription managers are deployed through manual GitHub Actions workflows rather than runtime containers.

