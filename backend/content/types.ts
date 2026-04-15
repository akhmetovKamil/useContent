import type { ObjectId } from "mongodb";
import type { AccessPolicy, PolicyMode } from "../domain/access";

export interface UserWalletDoc {
  address: string;
  kind: "primary" | "secondary";
  addedAt: Date;
}

export interface UserDoc {
  _id: ObjectId;
  username: string | null;
  displayName: string;
  bio: string;
  avatarFileId: ObjectId | null;
  primaryWallet: string;
  wallets: UserWalletDoc[];
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthorProfileDoc {
  _id: ObjectId;
  userId: string;
  slug: string;
  displayName: string;
  bio: string;
  avatarFileId: ObjectId | null;
  defaultPolicy: AccessPolicy;
  subscriptionPlanId: ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PostDoc {
  _id: ObjectId;
  authorId: ObjectId;
  title: string;
  content: string;
  status: "draft" | "published";
  policyMode: PolicyMode;
  policy: AccessPolicy | null;
  attachmentIds: ObjectId[];
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectDoc {
  _id: ObjectId;
  authorId: ObjectId;
  title: string;
  description: string;
  status: "draft" | "published";
  policyMode: PolicyMode;
  policy: AccessPolicy | null;
  rootNodeId: ObjectId;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectNodeDoc {
  _id: ObjectId;
  authorId: ObjectId;
  projectId: ObjectId;
  parentId: ObjectId | null;
  kind: "file" | "folder";
  name: string;
  storageKey: string | null;
  mimeType: string | null;
  size: number | null;
  visibility: "author" | "published";
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionPlanDoc {
  _id: ObjectId;
  authorId: ObjectId;
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

export interface SubscriptionEntitlementDoc {
  _id: ObjectId;
  authorId: ObjectId;
  subscriberWallet: string;
  planId: ObjectId;
  status: "active" | "expired";
  validUntil: Date;
  source: "onchain";
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfileResponse {
  id: string;
  username: string | null;
  displayName: string;
  bio: string;
  avatarFileId: string | null;
  primaryWallet: string;
  wallets: UserWalletDoc[];
  role: "user" | "admin";
  createdAt: string;
  updatedAt: string;
}

export interface AuthorProfileResponse {
  id: string;
  userId: string;
  slug: string;
  displayName: string;
  bio: string;
  avatarFileId: string | null;
  subscriptionPlanId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionEntitlementResponse {
  id: string;
  authorId: string;
  subscriberWallet: string;
  planId: string;
  status: "active" | "expired";
  validUntil: string;
  source: "onchain";
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionPlanResponse {
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
  createdAt: string;
  updatedAt: string;
}

export interface PostResponse {
  id: string;
  authorId: string;
  title: string;
  content: string;
  status: "draft" | "published";
  policyMode: PolicyMode;
  policy: AccessPolicy | null;
  attachmentIds: string[];
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectResponse {
  id: string;
  authorId: string;
  title: string;
  description: string;
  status: "draft" | "published";
  policyMode: PolicyMode;
  policy: AccessPolicy | null;
  rootNodeId: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateMyProfileRequest {
  username?: string | null;
  displayName?: string;
  bio?: string;
}

export interface CreateAuthorProfileRequest {
  slug: string;
  displayName: string;
  bio?: string;
}

export interface UpsertSubscriptionPlanRequest {
  title: string;
  chainId: number;
  tokenAddress: string;
  price: string;
  billingPeriodDays: number;
  contractAddress: string;
  active?: boolean;
}

export interface CreatePostRequest {
  title: string;
  content: string;
  status?: "draft" | "published";
  policyMode?: PolicyMode;
  policy?: AccessPolicy | null;
  attachmentIds?: string[];
}

export interface CreateProjectRequest {
  title: string;
  description?: string;
  status?: "draft" | "published";
  policyMode?: PolicyMode;
  policy?: AccessPolicy | null;
}
