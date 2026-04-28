import type { ObjectId } from "mongodb";

export interface SubscriptionPlanDoc {
  _id: ObjectId;
  authorId: ObjectId;
  code: string;
  title: string;
  paymentAsset: "erc20" | "native";
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
  status: "active" | "expired";
  validUntil: Date;
  source: "onchain";
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
  paymentAsset: "erc20" | "native";
  chainId: number;
  tokenAddress: string;
  contractAddress: string;
  price: string;
  billingPeriodDays: number;
  status: "pending" | "submitted" | "confirmed" | "expired" | "cancelled";
  txHash: string | null;
  entitlementId: ObjectId | null;
  paidUntil: Date | null;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
