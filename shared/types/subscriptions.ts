import type {
  BaseEntityDto,
  EntityId,
  Maybe,
  NullableDateString,
  TxHash,
  WalletAddress,
} from "./common";
import type { PAYMENT_ASSETS } from "../consts";

export type SubscriptionPaymentAsset = (typeof PAYMENT_ASSETS)[number];

export interface SubscriptionPlanDto extends BaseEntityDto {
  authorId: EntityId;
  code: string;
  title: string;
  paymentAsset: SubscriptionPaymentAsset;
  chainId: number;
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
  status: "active" | "expired";
  validUntil: string;
  source: "onchain";
}

export interface ReaderSubscriptionDto extends SubscriptionEntitlementDto {
  authorSlug: string;
  authorDisplayName: string;
  planCode: Maybe<string>;
  planTitle: Maybe<string>;
}

export interface AuthorSubscriberDto extends BaseEntityDto {
  subscriberWallet: WalletAddress;
  subscriberDisplayName: Maybe<string>;
  subscriberUsername: Maybe<string>;
  planId: EntityId;
  planCode: Maybe<string>;
  planTitle: Maybe<string>;
  accessPolicyNames: string[];
  status: "active" | "expired";
  validUntil: string;
}

export interface SubscriptionPaymentIntentDto extends BaseEntityDto {
  authorId: EntityId;
  subscriberWallet: WalletAddress;
  planId: EntityId;
  planCode: string;
  planKey: string;
  paymentAsset: SubscriptionPaymentAsset;
  chainId: number;
  tokenAddress: WalletAddress;
  contractAddress: WalletAddress;
  price: string;
  billingPeriodDays: number;
  status: "pending" | "submitted" | "confirmed" | "expired" | "cancelled";
  txHash: Maybe<TxHash>;
  entitlementId: Maybe<EntityId>;
  paidUntil: NullableDateString;
  expiresAt: string;
}

export interface UpsertSubscriptionPlanInput {
  code?: string;
  title: string;
  paymentAsset?: SubscriptionPaymentAsset;
  chainId: number;
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
