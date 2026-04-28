import { api } from "encore.dev/api";
import { getRequiredWallet } from "../lib/api-helpers";
import * as service from "./service";
import type {
  AuthorPlatformBillingResponse,
  AuthorPlatformCleanupPreviewResponse,
  AuthorPlatformCleanupRunResponse,
  ConfirmSubscriptionPaymentRequest,
  CreatePlatformSubscriptionPaymentIntentRequest,
  ContractDeploymentLookupResponse,
  PlatformPlanResponse,
  PlatformSubscriptionPaymentIntentResponse,
} from "./types";
import type { ListPlatformPlansResponseDto } from "../../shared/types/content";

export const listPlatformPlans = api(
  { method: "GET", path: "/platform/plans", expose: true },
  async (): Promise<ListPlatformPlansResponseDto> => {
    return { plans: service.listPlatformPlans() };
  },
);

export const getMyAuthorPlatformBilling = api(
  {
    method: "GET",
    path: "/me/author/platform-billing",
    expose: true,
    auth: true,
  },
  async (): Promise<AuthorPlatformBillingResponse> => {
    const walletAddress = getRequiredWallet();
    return service.getMyAuthorPlatformBilling(walletAddress);
  },
);

export const previewMyAuthorPlatformCleanup = api(
  {
    method: "GET",
    path: "/me/author/platform-cleanup-preview",
    expose: true,
    auth: true,
  },
  async (): Promise<AuthorPlatformCleanupPreviewResponse> => {
    const walletAddress = getRequiredWallet();
    return service.previewMyAuthorPlatformCleanup(walletAddress);
  },
);

export const runMyAuthorPlatformCleanup = api(
  {
    method: "POST",
    path: "/me/author/platform-cleanup",
    expose: true,
    auth: true,
  },
  async (): Promise<AuthorPlatformCleanupRunResponse> => {
    const walletAddress = getRequiredWallet();
    return service.runMyAuthorPlatformCleanup(walletAddress);
  },
);

export const getPlatformSubscriptionManagerDeployment = api(
  {
    method: "GET",
    path: "/contract-deployments/platform-subscription-manager/:chainId",
    expose: true,
  },
  async ({
    chainId,
  }: {
    chainId: string;
  }): Promise<ContractDeploymentLookupResponse> => {
    const deployment = await service.getPlatformSubscriptionManagerDeployment(
      Number(chainId),
    );
    return {
      deployment: deployment
        ? service.toContractDeploymentResponse(deployment)
        : null,
    };
  },
);

export const createPlatformSubscriptionPaymentIntent = api(
  {
    method: "POST",
    path: "/me/author/platform-payment-intents",
    expose: true,
    auth: true,
  },
  async (
    req: CreatePlatformSubscriptionPaymentIntentRequest,
  ): Promise<PlatformSubscriptionPaymentIntentResponse> => {
    const walletAddress = getRequiredWallet();
    const intent = await service.createPlatformSubscriptionPaymentIntent(
      walletAddress,
      req,
    );
    return service.toPlatformSubscriptionPaymentIntentResponse(intent);
  },
);

export const confirmPlatformSubscriptionPayment = api(
  {
    method: "POST",
    path: "/me/author/platform-payment-intents/:intentId/confirm",
    expose: true,
    auth: true,
  },
  async ({
    intentId,
    ...req
  }: ConfirmSubscriptionPaymentRequest & {
    intentId: string;
  }): Promise<PlatformSubscriptionPaymentIntentResponse> => {
    const walletAddress = getRequiredWallet();
    const intent = await service.confirmPlatformSubscriptionPayment(
      walletAddress,
      intentId,
      req,
    );
    return service.toPlatformSubscriptionPaymentIntentResponse(intent);
  },
);
