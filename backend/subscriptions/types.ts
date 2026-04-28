import type { Header } from "encore.dev/api";
import type {
  ConfirmSubscriptionPaymentRequest,
  CreateSubscriptionPaymentIntentRequest,
  UpsertContractDeploymentRequest,
} from "../lib/content-types";

export * from "../lib/content-types";

export interface ContractDeploymentChainRequest {
  chainId: string;
}

export type UpsertContractDeploymentRegistryRequest =
  UpsertContractDeploymentRequest & {
    deploymentRegistryToken: Header<"X-Deployment-Registry-Token">;
  };

export interface DeleteSubscriptionPlanRequest {
  planId: string;
}

export interface ListAuthorSubscriptionPlansRequest {
  slug: string;
}

export type CreateSubscriptionPaymentIntentPathRequest =
  CreateSubscriptionPaymentIntentRequest & {
    slug: string;
  };

export type ConfirmSubscriptionPaymentPathRequest =
  ConfirmSubscriptionPaymentRequest & {
    intentId: string;
  };
