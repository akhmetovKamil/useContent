import type { ObjectId } from "mongodb";
import type {
  CleanupRunStatus,
  PaymentIntentStatus,
  PlatformBillingStatus,
  PlatformFeature,
} from "../../shared/consts";
import type {
  AuthorPlatformCleanupItemDto,
  AuthorPlatformCleanupPreviewDto,
  PlatformPlanDto,
} from "../../shared/types/content";

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
  extraStorageBytes: number;
  totalStorageBytes: number;
  features: PlatformFeature[];
  validUntil: Date | null;
  graceUntil: Date | null;
  cleanupScheduledAt: Date | null;
  lastCleanupAt: Date | null;
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

export interface PlatformSubscriptionPaymentIntentDoc {
  _id: ObjectId;
  authorId: ObjectId;
  walletAddress: string;
  planCode: PlatformPlanDto["code"];
  tierKey: string;
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
