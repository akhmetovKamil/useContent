# Testing Strategy

Testing is split by layer: pure domain logic, frontend component behavior, backend services and smart contract behavior.

```mermaid
flowchart BT
    Smoke["Manual smoke checks<br/>wallet, publish, subscribe, download"]
    Frontend["Frontend unit/component tests<br/>Vitest + Testing Library"]
    Backend["Backend unit tests<br/>Vitest"]
    Contracts["Smart contract tests<br/>Hardhat"]
    Static["Static checks<br/>TypeScript, build, lint"]

    Static --> Contracts
    Static --> Backend
    Static --> Frontend
    Contracts --> Smoke
    Backend --> Smoke
    Frontend --> Smoke
```

## Backend tests

Backend tests cover access evaluation, subscriptions, platform billing, posts, projects and activity-related behavior. The goal is to protect business rules such as:

- locked content must not leak;
- archived and draft content must not appear in public lists;
- subscription confirmation must verify on-chain events;
- quota checks must block uploads when storage limits are exceeded.

## Frontend tests

Frontend tests focus on component states, validation, error handling, session behavior, cards and formatting helpers.

## Smart contract tests

Hardhat tests cover:

- plan registration and update;
- ERC-20 and native subscription payment;
- platform fee split for reader subscriptions;
- platform billing amount calculation;
- paidUntil extension;
- owner-only administrative methods.

## Acceptance scenarios

```gherkin
Given a reader has an active entitlement
When protected content is requested
Then the backend returns unlocked content
```

```gherkin
Given a reader does not satisfy the required access policy
When protected content is requested
Then the backend returns a locked preview or access error
```

```gherkin
Given an author exceeds the current storage quota
When a new file upload is attempted
Then the backend rejects the upload with a quota error
```

