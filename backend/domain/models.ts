import type { AccessPolicy, PolicyMode } from "./access";

export interface User {
  id: string;
  primaryWallet: string;
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
  avatarFileId: string | null;
  defaultPolicy: AccessPolicy;
  subscriptionPlanId: string | null;
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
  chainId: number;
  tokenAddress: string;
  price: string;
  billingPeriodDays: number;
  contractAddress: string;
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
