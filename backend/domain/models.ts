import type { AccessPolicy, PolicyMode } from "./access";

export interface UserWallet {
  address: string;
  kind: "primary" | "secondary";
  addedAt: Date;
}

export interface User {
  id: string;
  username: string | null;
  displayName: string;
  bio: string;
  avatarFileId: string | null;
  primaryWallet: string;
  wallets: UserWallet[];
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthorProfile {
  id: string;
  userId: string;
  slug: string;
  displayName: string;
  bio: string;
  tags: string[];
  avatarFileId: string | null;
  defaultPolicy: AccessPolicy;
  defaultPolicyId: string | null;
  subscriptionPlanId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccessPolicyPreset {
  id: string;
  authorId: string;
  name: string;
  description: string;
  policy: AccessPolicy;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Post {
  id: string;
  authorId: string;
  title: string;
  content: string;
  status: "draft" | "published";
  policyMode: PolicyMode;
  policy: AccessPolicy | null;
  accessPolicyId: string | null;
  attachmentIds: string[];
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  authorId: string;
  title: string;
  description: string;
  status: "draft" | "published";
  policyMode: PolicyMode;
  policy: AccessPolicy | null;
  accessPolicyId: string | null;
  rootNodeId: string;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectNode {
  id: string;
  authorId: string;
  projectId: string;
  parentId: string | null;
  kind: "file" | "folder";
  name: string;
  storageKey: string | null;
  mimeType: string | null;
  size: number | null;
  visibility: "author" | "published";
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionPlan {
  id: string;
  authorId: string;
  code: string;
  title: string;
  paymentAsset: "erc20" | "native";
  chainId: number;
  tokenAddress: string;
  price: string;
  billingPeriodDays: number;
  contractAddress: string;
  planKey: string;
  registrationTxHash: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionEntitlement {
  id: string;
  authorId: string;
  subscriberWallet: string;
  planId: string;
  status: "active" | "expired";
  validUntil: Date;
  source: "onchain";
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionPaymentIntent {
  id: string;
  authorId: string;
  subscriberWallet: string;
  planId: string;
  planCode: string;
  planKey: string;
  paymentAsset: "erc20" | "native";
  chainId: number;
  tokenAddress: string;
  contractAddress: string;
  price: string;
  billingPeriodDays: number;
  status: "pending" | "submitted" | "confirmed" | "expired" | "cancelled";
  txHash: string | null;
  entitlementId: string | null;
  paidUntil: Date | null;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
