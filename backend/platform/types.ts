import type { ConfirmSubscriptionPaymentRequest } from "../lib/content-types";

export type {
  AuthorPlatformBillingResponse,
  AuthorPlatformCleanupPreviewResponse,
  AuthorPlatformCleanupRunResponse,
  ContractDeploymentLookupResponse,
  CreatePlatformSubscriptionPaymentIntentRequest,
  PlatformPlanResponse,
  PlatformSubscriptionPaymentIntentResponse,
} from "../lib/content-types";

export interface ContractDeploymentChainRequest {
  chainId: string;
}

export type ConfirmPlatformSubscriptionPaymentPathRequest =
  ConfirmSubscriptionPaymentRequest & {
    intentId: string;
  };
