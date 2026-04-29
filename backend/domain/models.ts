import type {
  ContentStatus,
  ContentVisibility,
  PaymentAsset,
  PaymentIntentStatus,
  ProjectNodeKind,
  SubscriptionEntitlementSource,
  SubscriptionEntitlementStatus,
  UserRole,
  UserWalletKind,
} from "../../shared/consts";
import type { WalletAddress } from "../../shared/types/common"
import type { AccessPolicy, PolicyMode } from "./access";

export interface UserWallet {
  address: WalletAddress;
  kind: UserWalletKind;
  addedAt: Date;
}

export interface User {
  id: string;
  username: string | null;
  displayName: string;
  bio: string;
  avatarFileId: string | null;
  primaryWallet: WalletAddress;
  wallets: UserWallet[];
  role: UserRole;
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
  status: ContentStatus;
  policyMode: PolicyMode;
  policy: AccessPolicy | null;
  accessPolicyId: string | null;
  attachmentIds: string[];
  linkedProjectIds: string[];
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  authorId: string;
  title: string;
  description: string;
  status: ContentStatus;
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
  kind: ProjectNodeKind;
  name: string;
  storageKey: string | null;
  mimeType: string | null;
  size: number | null;
  visibility: ContentVisibility;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionPlan {
  id: string;
  authorId: string;
  code: string;
  title: string;
  paymentAsset: PaymentAsset;
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
  subscriberWallet: WalletAddress;
  planId: string;
  status: SubscriptionEntitlementStatus;
  validUntil: Date;
  source: SubscriptionEntitlementSource;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionPaymentIntent {
  id: string;
  authorId: string;
  subscriberWallet: WalletAddress;
  planId: string;
  planCode: string;
  planKey: string;
  paymentAsset: PaymentAsset;
  chainId: number;
  tokenAddress: string;
  contractAddress: string;
  price: string;
  billingPeriodDays: number;
  status: PaymentIntentStatus;
  txHash: string | null;
  entitlementId: string | null;
  paidUntil: Date | null;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
