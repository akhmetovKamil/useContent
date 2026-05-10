import type { ObjectId } from "mongodb";
import type {
  CleanupRunStatus,
  PaymentIntentStatus,
  PlatformBillingStatus,
  PlatformFeature,
} from "../../shared/consts";
import type { AuthorPlatformCleanupItemDto, AuthorPlatformCleanupPreviewDto, PlatformPlanDto } from "../../shared/types/platform"

export interface AuthorStorageUsageStats {
  postsBytes: number;
  projectsBytes: number;
}

export type PlatformPlanDoc = PlatformPlanDto;

export interface AuthorPlatformSubscriptionDoc {
  _id: ObjectId;
  authorId: ObjectId;
  walletAddress: string;
  planCode: PlatformPlanDto["code"];
  status: Exclude<PlatformBillingStatus, "free">;
  baseStorageBytes: number;
  features: PlatformFeature[];
  validUntil: Date | null;
  graceUntil: Date | null;
  cleanupScheduledAt: Date | null;
  lastCleanupAt: Date | null;
  lastTxHash: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthorPlatformStorageSubscriptionDoc {
  _id: ObjectId;
  authorId: ObjectId;
  walletAddress: string;
  status: Exclude<PlatformBillingStatus, "free">;
  extraStorageBytes: number;
  validUntil: Date | null;
  graceUntil: Date | null;
  lastTxHash: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthorPlatformCleanupLogDoc {
  _id: ObjectId;
  authorId: ObjectId;
  status: CleanupRunStatus;
  deletedBytes: number;
  deletedItems: AuthorPlatformCleanupItemDto[];
  previewBefore: AuthorPlatformCleanupPreviewDto;
  previewAfter: AuthorPlatformCleanupPreviewDto;
  createdAt: Date;
}

export interface PlatformTierPaymentIntentDoc {
  _id: ObjectId;
  authorId: ObjectId;
  walletAddress: string;
  planCode: PlatformPlanDto["code"];
  tierKey: string;
  chainId: number;
  tokenAddress: string;
  contractAddress: string;
  amount: string;
  status: PaymentIntentStatus;
  txHash: string | null;
  validUntil: Date | null;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlatformStoragePaymentIntentDoc {
  _id: ObjectId;
  authorId: ObjectId;
  walletAddress: string;
  extraStorageGb: number;
  chainId: number;
  tokenAddress: string;
  contractAddress: string;
  amount: string;
  status: PaymentIntentStatus;
  txHash: string | null;
  validUntil: Date | null;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
