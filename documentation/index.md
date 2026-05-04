---
layout: home

hero:
  name: useContent
  text: Engineering Documentation
  tagline: A wallet-native content platform with access policies, on-chain subscriptions, protected files, and creator billing.
  actions:
    - theme: brand
      text: Start with Overview
      link: /overview/introduction
    - theme: alt
      text: View Architecture
      link: /architecture/

features:
  - title: Wallet-native identity
    details: Users sign nonce challenges with an EVM wallet and receive a short-lived JWT session.
  - title: Policy-based access
    details: Posts and projects are protected through reusable access policies with subscription, token, NFT, AND and OR rules.
  - title: Protected content delivery
    details: Metadata is stored in MongoDB, binary content is stored in MinIO, and private downloads are issued through backend-verified signed URLs.
  - title: On-chain subscriptions
    details: Smart contracts handle reader-to-author subscriptions and author-to-platform billing with events confirmed by the backend.
---

## What this documentation is

This portal describes useContent as an engineering system. It is not an end-user help center. The goal is to explain the current implementation: architecture, flows, data model, smart contracts, deployment and testing.

The documentation is intentionally focused on implemented behavior. Potential future features are not mixed into the core pages.

## Fast paths

<div class="doc-grid">
    <a class="doc-card" href="/architecture/">
        <span class="doc-badge">Architecture</span>
        <strong>Architecture Overview</strong>
        <span>See how the browser, backend, MongoDB, MinIO and EVM networks interact.</span>
    </a>
    <a class="doc-card" href="/flows/">
        <span class="doc-badge">Flow</span>
        <strong>Runtime Flows</strong>
        <span>Follow file upload, subscription confirmation, billing and promoted feed paths.</span>
    </a>
    <a class="doc-card" href="/frontend/data-flow">
        <span class="doc-badge">Frontend</span>
        <strong>Frontend Data Flow</strong>
        <span>Understand TanStack Query, API classes, session state and mutation invalidation.</span>
    </a>
    <a class="doc-card" href="/deployment/">
        <span class="doc-badge">Ops</span>
        <strong>Deployment</strong>
        <span>Review Coolify runtime, GitHub Actions, contract workflows and static docs deploy.</span>
    </a>
</div>
