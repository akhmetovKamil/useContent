import type { ObjectId } from "mongodb";
import type {
  PaymentAsset,
  PaymentIntentStatus,
  SubscriptionEntitlementSource,
  SubscriptionEntitlementStatus,
} from "../../shared/consts";

export interface SubscriptionPlanDoc {
  _id: ObjectId;
  authorId: ObjectId;
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

export interface SubscriptionEntitlementDoc {
  _id: ObjectId;
  authorId: ObjectId;
  subscriberWallet: string;
  planId: ObjectId;
  status: SubscriptionEntitlementStatus;
  validUntil: Date;
  source: SubscriptionEntitlementSource;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionPaymentIntentDoc {
  _id: ObjectId;
  authorId: ObjectId;
  subscriberWallet: string;
  planId: ObjectId;
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
  entitlementId: ObjectId | null;
  paidUntil: Date | null;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
