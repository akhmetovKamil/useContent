import type { ConfirmSubscriptionPaymentRequest } from "../lib/content-types";

export * from "../lib/content-types";

export interface ContractDeploymentChainRequest {
  chainId: string;
}

export type ConfirmPlatformSubscriptionPaymentPathRequest =
  ConfirmSubscriptionPaymentRequest & {
    intentId: string;
  };
