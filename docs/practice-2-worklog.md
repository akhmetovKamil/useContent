# Practice 2 Worklog

This file is a running log for the second practice and diploma implementation phase. It is intended to help later when drafting:

- diary
- individual assignment
- report

## 2026-04-15

### Context collection and baseline audit

Performed a full repository and materials review:

- inspected monorepo structure
- read repository-level and backend-level instruction files
- reviewed the current Encore.ts backend implementation
- identified actual implemented backend modules: `auth`, `storage`, `files`
- confirmed that `frontend/` is empty
- confirmed that `contracts/` contains only a draft payment contract
- extracted and reviewed the latest versions of first-practice diary, individual assignment, and report
- reviewed the official VKR assignment
- extracted text from the diploma presentation
- reviewed formatting/style guidance from the document template

### Key conclusions captured

- the codebase is still at a very early stage relative to the final diploma scope
- the previous practice focused mainly on backend and infrastructure
- the diploma should now move toward a real end-to-end platform
- the working direction from current notes is `web3-only`, with crypto subscriptions and `MinIO` storage
- several product decisions are still open and need to be fixed before implementation accelerates
- access/payment architecture must be extensible from the start, even if the first implemented rule set is intentionally small
- second practice should be documented as a new phase with new results, plus a short retrospective and a small testing section
- existing infrastructure baseline includes server, Coolify, and GitHub Actions for backend delivery
- frontend deployment strategy is intentionally deferred until the frontend skeleton exists

### Artifacts created

- `/Users/kamil/Documents/projects/useContent/docs/diploma-context.md`
- `/Users/kamil/Documents/projects/useContent/docs/practice-2-worklog.md`
- `/Users/kamil/Documents/projects/useContent/docs/access-model.md`

### Follow-up recommendation

Use the next session to finalize:

1. MVP boundaries
2. data model
3. access-control rules
4. contract scope
5. frontend architecture and UI stack

## 2026-04-15 (continued)

### Access model decision

Finalized the access model direction for MVP:

- the platform will support mixed access per author
- author accounts will not be limited to one global rule for all content
- authors will have a default access policy
- posts and projects may either inherit or override that default
- files and folders inside projects will inherit the project policy in MVP
- internal policy representation will use an extensible rule tree
- UI support in MVP will stay intentionally narrower than the internal rule system

### Backend foundation implementation

Started translating the architecture into code:

- added shared backend domain types for access policies
- added shared MVP domain models for users, authors, posts, projects, project nodes, and subscriptions
- implemented a pure `policy evaluator` for `public`, `subscription`, `token_balance`, `nft_ownership`, and `or`
- implemented policy resolution logic for `public`, `inherited`, and `custom`
- added unit tests for the first evaluator scenarios

### Content persistence preparation

Prepared the next backend layer for real feature work:

- added a new `content` service boundary in Encore
- added Mongo document types for author profiles, posts, projects, project nodes, subscription plans, and subscription entitlements
- added a shared repository module for the `content` collections
- defined first indexes for slugs, author content queries, project tree access, and subscription lookup flows

### User profile groundwork

Extended the model toward a real user-facing account:

- added a `User` domain shape with profile fields and linked wallets
- added Mongo document types for user profiles and wallet links
- prepared repository access for the `users` collection
- added indexes for primary wallet, optional username, and linked wallet addresses

### First profile endpoints

Added the first real content/profile functionality on top of the model:

- implemented `get or create` logic for wallet-based user profiles
- added profile update logic for `username`, `displayName`, and `bio`
- added author profile creation with slug validation
- added public author profile lookup by slug
- exposed initial endpoints for `GET /me`, `PATCH /me`, `POST /authors`, and `GET /authors/:slug`

### Personal cabinet groundwork

Expanded the private account surface for future frontend pages:

- added `GET /me/author` for the current user's author profile
- added `GET /me/entitlements` for a user's current access records
- added response mapping for subscription entitlements
- added repository support for listing entitlements by subscriber wallet

### Subscription plan groundwork

Started the author monetization layer:

- added a single main subscription plan model for each author
- added author-side plan retrieval and upsert logic
- added public retrieval of an active author subscription plan by slug
- linked newly created plans back to the author profile
- exposed endpoints for `GET /me/subscription-plan`, `PUT /me/subscription-plan`, and `GET /authors/:slug/subscription-plan`

### Posts groundwork

Started the first real content entity:

- added post creation for the current author
- added private listing of the author's own posts
- added public listing of published posts by author slug
- connected post creation to `policyMode` and custom policy validation
- kept full gated post-reading for the next step, when viewer-aware access checks are added

### Gated post read flow

Connected a public post endpoint to the access model:

- added public reading of a single published post by author slug and post id
- resolved effective access policy from `public`, `inherited`, or `custom`
- supported optional bearer token parsing for viewer-aware access checks
- connected subscription entitlements to access evaluation for gated post reads
- left token and NFT ownership as future on-chain grant sources

### Initial projects layer

Started the second major content type after posts:

- added project creation for the current author
- added private listing of the author's own projects
- added public listing of published projects by author slug
- connected projects to the same `policyMode` and custom policy validation model
- created a root folder node for each new project as the base of the future project tree

### Gated project read flow

Extended viewer-aware access checks from posts to projects:

- added public reading of a single published project by author slug and project id
- resolved effective project access policy from `public`, `inherited`, or `custom`
- reused optional bearer token parsing for viewer-aware access checks
- connected subscription entitlements to gated project reads
- kept token and NFT ownership as future on-chain grant sources for projects too

### Frontend UI foundation

Prepared the frontend for a consistent shadcn/Magic UI-based interface:

- added a shadcn-compatible `components.json` configuration
- added shared UI primitives for buttons, cards, badges, labels, inputs, selects, textareas, and page sections
- added the shared `cn` helper with class merging support
- moved the main reader/author dashboard, wallet block, profile page, post/project managers, and access policy builder onto shared UI components
- kept the server deployment files unchanged while refactoring the frontend layer
- verified frontend formatting, linting, and production build after the UI refactor

### Project file storage revision

Reworked the backend file direction around project folders and MinIO-compatible object storage:

- added a low-level object storage helper around the Encore object bucket
- moved legacy personal file operations onto the shared storage helper
- added shared DTOs for project file tree nodes
- added author-side project node APIs for listing folders/files, creating folders, uploading files, updating metadata, deleting nodes, and downloading files
- added public project node listing and download APIs protected by the existing project access policy evaluation
- connected project deletion to object cleanup so uploaded project files are removed from storage together with project nodes
- added repository support for project node lookup, recursive deletion, public visibility filtering, and project tree listing
- verified TypeScript and unit tests after the storage/file revision

### Subscription payment flow groundwork

Added the first backend pass for crypto subscription payments:

- added subscription payment intent DTOs and Mongo document model
- added reader-side payment intent creation for an active author subscription plan
- stored a snapshot of plan price, token, contract, chain, and billing period inside the intent
- added transaction hash confirmation for payment intents
- connected confirmed payment intents to active subscription entitlement creation or renewal
- added idempotency protection for duplicated transaction hashes
- added reader-side listing of recent subscription payment intents
- added indexes for payment intent lookup, author status filtering, transaction uniqueness, and entitlement upsert
- verified TypeScript and unit tests after the subscription payment revision

### Access policy and subscription model revision

Reworked access management into reusable author-owned rules:

- added saved access policy presets for authors
- connected author default access to a saved policy preset
- added `accessPolicyId` support for posts and projects
- kept inline policy JSON compatibility for backend APIs, while moving the frontend to saved policy selection
- added multiple subscription plans by `code` instead of one hard-coded main plan only
- updated the access policy builder so subscription rules can choose from saved subscription plans
- replaced the old single-plan frontend page with a combined Access page for plans and reusable policies
- updated post and project forms to select saved access policies
- verified backend TypeScript/tests and frontend format/lint/build

### Frontend structure and theme cleanup

Reworked the frontend layout after adding shadcn and Magic UI components:

- removed the temporary Magic UI globe from the home page
- removed unused `cobe` and `motion` frontend dependencies
- moved global stores into `src/stores`
- moved reusable React UI pieces into `src/components`
- moved wallet session logic into `src/hooks`
- renamed the old `lib`/`shared` utility layer into `src/utils`
- moved access policy React UI into `components/access` and kept policy builder logic in `utils/access-policy`
- split the home page into dedicated hero and metrics components
- split the author workspace into reusable dashboard metric/action cards
- extracted the duplicated post and project author forms into a shared content manager component
- updated global CSS to expose shadcn-compatible theme variables for reader and author themes
- updated shadcn aliases so new components target `src/components/ui` and shared helpers target `src/utils`
- verified frontend linting and production build after the restructure

### On-chain subscription manager revision

Added the first full on-chain subscription flow:

- replaced the temporary one-off payment contract with a shared `SubscriptionManager`
- added Hardhat TypeScript tooling, deploy script, Solidity tests, and Solidity package metadata
- implemented author-owned on-chain plan registration and updates
- implemented ERC-20 subscription payments with a 20% platform fee and 80% author payout
- exported a shared `SubscriptionManager` ABI for frontend and backend usage
- added `planKey`, registration transaction hash, and on-chain paid-until data to subscription DTOs
- updated backend payment confirmation to verify `SubscriptionPaid` events from RPC before granting access
- updated frontend author access settings to publish/update plans on-chain before saving them
- updated public author pages with an approve/subscribe/confirm payment flow
- verified Solidity tests, backend tests, backend TypeScript, frontend linting, and frontend production build

### Native token subscriptions and deployment registry

Extended the first on-chain subscription implementation for practical testnet usage:

- added native chain token payments in addition to ERC-20 payments
- kept ERC-20 payments as `approve + subscribe`
- implemented native payments through `subscribe` with `msg.value`
- preserved the same platform fee split for both payment modes
- added deployment registry storage in MongoDB so manager contract addresses do not need to be hard-coded in frontend environment variables
- added manual GitHub Actions workflow support for controlled smart contract deployment
- clarified that Coolify and docker-compose are used for application runtime, while contract deployment is a separate controlled job
- adjusted frontend and backend configuration so public chain/RPC settings and deployed manager addresses are resolved consistently

### Author and reader workspace implementation

Built the first complete role-based workspace flow:

- added wallet-authenticated user entry flow
- restricted protected navigation before nonce signing and session creation
- added author onboarding with profile fields, slug, description and tags
- implemented author account deletion while preserving the user account
- added author settings for profile editing
- added reader profile, reader settings, subscriptions page and feed page
- added author subscriber list and linked it from author workspace metrics
- added author discovery on the reader home page
- added public author profile pages with visible access tiers and subscription actions
- refined workspace navigation with a fixed Magic UI-style dock and role-aware visibility
- added configurable visual palettes for the user and author workspace themes

### Public feeds and post pages

Expanded the content reading flow from simple lists to real feed pages:

- added author-side post list with edit, delete, publish and archive actions
- added reader-side author feed that reuses the same post card component without author controls
- added a global reader feed containing posts from subscribed authors
- added a separate public post details route
- displayed author identity, publication date, access tier and content status on post pages
- ensured locked posts can remain visible as cards while protected content stays hidden until the required access condition is active
- added tier labels to posts shown in author feeds, public author pages and the reader feed

### Post interactions, publication states and attachments

Added richer post functionality for the exploitation phase:

- implemented draft, published and archived post states
- ensured draft posts are hidden from readers until published
- added archive and unarchive flows for author-managed posts
- added optimistic UI updates for archiving actions
- replaced browser `prompt`, `confirm` and `alert` interactions with project UI modal components
- added post likes
- added post comments available only to users with content access and to the author
- added different visual treatment for author comments
- added post view counting
- added post attachment upload support for images, video, audio and other files
- added media previews on post detail pages
- added linked projects so posts can reference existing author projects
- connected post media objects to MinIO-backed object storage through backend APIs

### Project access feed and file tree management

Developed projects into a first-class content type rather than a simple placeholder:

- added public project pages with access checks
- added author-side project creation and management
- added project draft, published and archived states
- added project archive and publish flows
- added project descriptions and tags for user-facing context above the file tree
- implemented project folder trees with folder creation, file upload, metadata update and deletion
- added multi-file upload support
- added folder upload support for bulk project import from local file structures
- protected public project node listing and file download with the same access policy model used for posts
- fixed overlapping Encore routes by flattening project node API endpoints
- connected project-node cache invalidation to project list and stat updates on the frontend

### Project previews, downloads and bundle manifests

Improved project exploitation and reader usability:

- added project file statistics: file count, folder count and total size
- added project bundle manifest endpoints for author and public project access
- added recursive folder bundle generation on the backend
- added frontend folder download actions based on bundle manifests
- added file preview modal for project files
- supported image, video, audio, PDF, text and JSON previews where browser rendering is practical
- kept unsupported file types downloadable without claiming universal preview support
- displayed project file/folder statistics in author project management, project cards and public project pages

### Practice 2 writing preparation

Prepared the documentation direction for the second practice:

- reviewed the second-practice templates, Pavlov example documents and first-practice Akhmetov documents
- fixed the practice period as `26.03.2026 - 22.04.2026`
- decided to keep the first-practice supervisors for Akhmetov documents
- planned the individual assignment, daily diary entries, report structure, screenshots and appendix code fragments
- installed local Python packages for future DOCX generation: `python-docx`, `lxml`, `Pillow`
- created `docs/practice-2-report-plan.md` as the main writing handoff context
