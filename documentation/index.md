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

