import type { NftStandard, PaymentAsset } from "../../shared/consts";

export interface VerifyPlanRegistrationInput {
  authorWallet: string;
  chainId: number;
  contractAddress: string;
  planKey: string;
  paymentAsset: PaymentAsset;
  tokenAddress: string;
  price: string;
  billingPeriodDays: number;
  active: boolean;
  txHash: string;
}

export interface VerifySubscriptionPaymentInput {
  subscriberWallet: string;
  chainId: number;
  contractAddress: string;
  planKey: string;
  paymentAsset: PaymentAsset;
  tokenAddress: string;
  price: string;
  txHash: string;
}

export interface VerifiedSubscriptionPayment {
  paidUntil: Date;
}

export interface VerifyPlatformSubscriptionPaymentInput {
  authorWallet: string;
  chainId: number;
  contractAddress: string;
  tierKey: string;
  extraStorageGb: number;
  tokenAddress: string;
  amount: string;
  txHash: string;
}

export interface VerifiedPlatformSubscriptionPayment {
  paidUntil: Date;
}

export interface OnChainAccessGrants {
  tokenBalances: Array<{
    chainId: number;
    contractAddress: string;
    balance: string;
  }>;
  nftOwnerships: Array<{
    chainId: number;
    contractAddress: string;
    standard: NftStandard;
    tokenId?: string;
    balance?: string;
  }>;
}
