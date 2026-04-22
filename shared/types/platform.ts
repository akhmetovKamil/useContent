import type {
  EntityId,
  NullableDateString,
  OnChainPaymentBaseDto,
  WalletAddress,
} from "./common";

export type PlatformFeature = "posts" | "projects" | "homepage_promo";

export type PlatformBillingStatus = "free" | "active" | "grace" | "expired";

export interface PlatformPlanDto {
  code: "free" | "basic";
  title: string;
  description: string;
  priceUsdCents: number;
  billingPeriodDays: number;
  baseStorageBytes: number;
  maxExtraStorageBytes: number;
  pricePerExtraGbUsdCents: number;
  features: PlatformFeature[];
  active: boolean;
  sortOrder: number;
}

export interface AuthorPlatformBillingDto {
  authorId: EntityId;
  plan: PlatformPlanDto;
  planCode: PlatformPlanDto["code"];
  status: PlatformBillingStatus;
  validUntil: NullableDateString;
  graceUntil: NullableDateString;
  cleanupScheduledAt: NullableDateString;
  lastCleanupAt: NullableDateString;
  baseStorageBytes: number;
  extraStorageBytes: number;
  totalStorageBytes: number;
  usedStorageBytes: number;
  remainingStorageBytes: number;
  postsBytes: number;
  projectsBytes: number;
  features: PlatformFeature[];
  isProjectCreationAllowed: boolean;
  isUploadAllowed: boolean;
}

export type AuthorPlatformCleanupItemKind = "post_attachment" | "project_file";

export interface AuthorPlatformCleanupItemDto {
  id: EntityId;
  kind: AuthorPlatformCleanupItemKind;
  parentId: EntityId;
  fileName: string;
  storageKey: string;
  size: number;
  createdAt: string;
}

export interface AuthorPlatformCleanupPreviewDto {
  authorId: EntityId;
  status: PlatformBillingStatus;
  freeStorageBytes: number;
  usedStorageBytes: number;
  bytesToDelete: number;
  willDeleteBytes: number;
  candidates: AuthorPlatformCleanupItemDto[];
}

export interface AuthorPlatformCleanupRunDto {
  id: EntityId;
  authorId: EntityId;
  status: "skipped" | "completed";
  deletedBytes: number;
  deletedItems: AuthorPlatformCleanupItemDto[];
  previewAfter: AuthorPlatformCleanupPreviewDto;
  createdAt: string;
}

export interface PlatformSubscriptionPaymentIntentDto extends OnChainPaymentBaseDto {
  authorId: EntityId;
  walletAddress: WalletAddress;
  planCode: PlatformPlanDto["code"];
  tierKey: string;
  extraStorageGb: number;
  status: "pending" | "submitted" | "confirmed" | "expired" | "cancelled";
  validUntil: NullableDateString;
  expiresAt: string;
}

export interface CreatePlatformSubscriptionPaymentIntentInput {
  planCode: PlatformPlanDto["code"];
  extraStorageGb: number;
  chainId: number;
  tokenAddress: WalletAddress;
}
