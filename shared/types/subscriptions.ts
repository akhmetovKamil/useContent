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
}

export interface AuthorSubscriberDto extends BaseEntityDto {
  subscriberWallet: WalletAddress;
  subscriberDisplayName: Maybe<string>;
  subscriberUsername: Maybe<string>;
  planId: EntityId;
  planCode: Maybe<string>;
  planTitle: Maybe<string>;
  accessPolicyNames: string[];
  status: SubscriptionEntitlementStatus;
  validUntil: string;
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
