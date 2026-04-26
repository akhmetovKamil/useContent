import type {
  CleanupItemKind,
  CleanupRunStatus,
  PaymentIntentStatus,
  PlatformBillingStatus,
  PlatformFeature,
  PlatformPlanCode,
} from "../consts";
import type {
  ChainId,
  EntityId,
  NullableDateString,
  OnChainPaymentBaseDto,
  WalletAddress,
} from "./common";

export interface PlatformPlanDto {
  code: PlatformPlanCode;
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
  planCode: PlatformPlanCode;
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

export type AuthorPlatformCleanupItemKind = CleanupItemKind;
export type {
  CleanupItemKind,
  CleanupRunStatus,
  PaymentIntentStatus,
  PlatformBillingStatus,
  PlatformFeature,
  PlatformPlanCode,
} from "../consts";

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
  status: CleanupRunStatus;
  deletedBytes: number;
  deletedItems: AuthorPlatformCleanupItemDto[];
  previewAfter: AuthorPlatformCleanupPreviewDto;
  createdAt: string;
}

export interface PlatformSubscriptionPaymentIntentDto extends OnChainPaymentBaseDto {
  authorId: EntityId;
  walletAddress: WalletAddress;
  planCode: PlatformPlanCode;
  tierKey: string;
  extraStorageGb: number;
  status: PaymentIntentStatus;
  validUntil: NullableDateString;
  expiresAt: string;
}

export interface CreatePlatformSubscriptionPaymentIntentInput {
  planCode: PlatformPlanCode;
  extraStorageGb: number;
  chainId: ChainId;
  tokenAddress: WalletAddress;
}
