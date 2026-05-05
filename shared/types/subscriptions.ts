import type {
  BaseEntityDto,
  ChainId,
  EntityId,
  Maybe,
  NullableDateString,
  TxHash,
  WalletAddress,
} from "./common";
import type {
  PaymentAsset,
  PaymentIntentStatus,
  SubscriptionEntitlementSource,
  SubscriptionEntitlementStatus,
} from "../consts";

export type SubscriptionPaymentAsset = PaymentAsset;

export interface SubscriptionPlanDto extends BaseEntityDto {
  authorId: EntityId;
  code: string;
  title: string;
  paymentAsset: SubscriptionPaymentAsset;
  chainId: ChainId;
  tokenAddress: WalletAddress;
  price: string;
  billingPeriodDays: number;
  contractAddress: WalletAddress;
  planKey: string;
  registrationTxHash: Maybe<string>;
  active: boolean;
  activeSubscribersCount: number;
}

export interface SubscriptionEntitlementDto extends BaseEntityDto {
  authorId: EntityId;
  subscriberWallet: WalletAddress;
  planId: EntityId;
  status: SubscriptionEntitlementStatus;
  validUntil: string;
  source: SubscriptionEntitlementSource;
}

export interface ReaderSubscriptionDto extends SubscriptionEntitlementDto {
  authorSlug: string;
  authorDisplayName: string;
  planCode: Maybe<string>;
  planTitle: Maybe<string>;
  paymentAsset: Maybe<SubscriptionPaymentAsset>;
  chainId: Maybe<ChainId>;
  tokenAddress: Maybe<WalletAddress>;
  price: Maybe<string>;
  billingPeriodDays: Maybe<number>;
  lastPaymentAt: Maybe<string>;
}

export interface AuthorSubscriberDto extends BaseEntityDto {
  subscriberWallet: WalletAddress;
  subscriberDisplayName: Maybe<string>;
  subscriberUsername: Maybe<string>;
  planId: EntityId;
  planCode: Maybe<string>;
  planTitle: Maybe<string>;
  paymentAsset: Maybe<SubscriptionPaymentAsset>;
  chainId: Maybe<ChainId>;
  tokenAddress: Maybe<WalletAddress>;
  price: Maybe<string>;
  billingPeriodDays: Maybe<number>;
  accessPolicyNames: string[];
  status: SubscriptionEntitlementStatus;
  validUntil: string;
}

export interface SubscriptionRevenueAssetDto {
  chainId: ChainId;
  paymentAsset: SubscriptionPaymentAsset;
  tokenAddress: WalletAddress;
  grossAmount: string;
  netAmount: string;
  platformFeeAmount: string;
  confirmedPayments: number;
}

export interface SubscriptionRevenueSeriesPointDto {
  period: string;
  assets: SubscriptionRevenueAssetDto[];
}

export interface AuthorDashboardPlanBreakdownDto {
  planId: EntityId;
  planCode: string;
  planTitle: string;
  paymentAsset: SubscriptionPaymentAsset;
  chainId: ChainId;
  tokenAddress: WalletAddress;
  price: string;
  billingPeriodDays: number;
  activeSubscribers: number;
  expiredSubscribers: number;
  totalSubscribers: number;
  activeRevenueByAsset: SubscriptionRevenueAssetDto[];
}

export interface AuthorDashboardRecentSubscriberDto {
  id: EntityId;
  subscriberWallet: WalletAddress;
  subscriberDisplayName: Maybe<string>;
  subscriberUsername: Maybe<string>;
  planId: EntityId;
  planCode: Maybe<string>;
  planTitle: Maybe<string>;
  status: SubscriptionEntitlementStatus;
  validUntil: string;
  createdAt: string;
}

export interface AuthorDashboardDto {
  counts: {
    posts: number;
    projects: number;
    uniqueSubscribers: number;
    activeSubscribers: number;
    expiredSubscribers: number;
  };
  planBreakdown: AuthorDashboardPlanBreakdownDto[];
  activeRevenueByAsset: SubscriptionRevenueAssetDto[];
  revenueSeries: {
    month: SubscriptionRevenueSeriesPointDto[];
    year: SubscriptionRevenueSeriesPointDto[];
  };
  recentSubscribers: AuthorDashboardRecentSubscriberDto[];
}

export interface ReaderDashboardSubscriptionDto extends ReaderSubscriptionDto {}

export interface ReaderDashboardDto {
  counts: {
    activeSubscriptions: number;
    expiredSubscriptions: number;
    paidAuthors: number;
    expiringSoon: number;
  };
  spendByAsset: SubscriptionRevenueAssetDto[];
  upcomingExpirations: ReaderDashboardSubscriptionDto[];
  subscriptionsByAuthor: ReaderDashboardSubscriptionDto[];
}

export interface SubscriptionPaymentIntentDto extends BaseEntityDto {
  authorId: EntityId;
  subscriberWallet: WalletAddress;
  planId: EntityId;
  planCode: string;
  planKey: string;
  paymentAsset: SubscriptionPaymentAsset;
  chainId: ChainId;
  tokenAddress: WalletAddress;
  contractAddress: WalletAddress;
  price: string;
  billingPeriodDays: number;
  status: PaymentIntentStatus;
  txHash: Maybe<TxHash>;
  entitlementId: Maybe<EntityId>;
  paidUntil: NullableDateString;
  expiresAt: string;
}

export interface UpsertSubscriptionPlanInput {
  code?: string;
  title: string;
  paymentAsset?: SubscriptionPaymentAsset;
  chainId: ChainId;
  tokenAddress: WalletAddress;
  price: string;
  billingPeriodDays: number;
  contractAddress: WalletAddress;
  planKey?: string;
  registrationTxHash?: Maybe<string>;
  active?: boolean;
}

export interface CreateSubscriptionPaymentIntentInput {
  planCode?: string;
}

export interface ConfirmSubscriptionPaymentInput {
  txHash: string;
}
