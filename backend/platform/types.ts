import type { ConfirmSubscriptionPaymentRequest } from "../lib/content-types";

export type {
  AuthorPlatformBillingResponse,
  AuthorPlatformCleanupPreviewResponse,
  AuthorPlatformCleanupRunResponse,
  ContractDeploymentLookupResponse,
  CreatePlatformStoragePaymentIntentRequest,
  CreatePlatformTierPaymentIntentRequest,
  PlatformPlanResponse,
  PlatformStoragePaymentIntentResponse,
  PlatformTierPaymentIntentResponse,
} from "../lib/content-types";

export interface ContractDeploymentChainRequest {
  chainId: string;
}

export type ConfirmPlatformPaymentPathRequest =
  ConfirmSubscriptionPaymentRequest & {
    intentId: string;
  };
