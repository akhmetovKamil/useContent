import { api } from "encore.dev/api";
import { getRequiredWallet } from "../lib/api-helpers";
import {
  toContractDeploymentResponse,
  toPlatformStoragePaymentIntentResponse,
  toPlatformTierPaymentIntentResponse,
} from "../lib/content-common";
import * as service from "./service";
import type {
  AuthorPlatformBillingResponse,
  AuthorPlatformCleanupPreviewResponse,
  AuthorPlatformCleanupRunResponse,
  ConfirmPlatformPaymentPathRequest,
  CreatePlatformStoragePaymentIntentRequest,
  CreatePlatformTierPaymentIntentRequest,
  ContractDeploymentChainRequest,
  ContractDeploymentLookupResponse,
  PlatformPlanResponse,
  PlatformStoragePaymentIntentResponse,
  PlatformTierPaymentIntentResponse,
} from "./types";
import type { ListPlatformPlansResponseDto } from "../../shared/types/responses"

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

export const getPlatformTierManagerDeployment = api(
  {
    method: "GET",
    path: "/contract-deployments/platform-tier-manager/:chainId",
    expose: true,
  },
  async ({
    chainId,
  }: ContractDeploymentChainRequest): Promise<ContractDeploymentLookupResponse> => {
    const deployment = await service.getPlatformTierManagerDeployment(
      Number(chainId),
    );
    return {
      deployment: deployment ? toContractDeploymentResponse(deployment) : null,
    };
  },
);

export const getPlatformStorageManagerDeployment = api(
  {
    method: "GET",
    path: "/contract-deployments/platform-storage-manager/:chainId",
    expose: true,
  },
  async ({
    chainId,
  }: ContractDeploymentChainRequest): Promise<ContractDeploymentLookupResponse> => {
    const deployment = await service.getPlatformStorageManagerDeployment(
      Number(chainId),
    );
    return {
      deployment: deployment ? toContractDeploymentResponse(deployment) : null,
    };
  },
);

export const createPlatformTierPaymentIntent = api(
  {
    method: "POST",
    path: "/me/author/platform-tier-payment-intents",
    expose: true,
    auth: true,
  },
  async (
    req: CreatePlatformTierPaymentIntentRequest,
  ): Promise<PlatformTierPaymentIntentResponse> => {
    const walletAddress = getRequiredWallet();
    const intent = await service.createPlatformTierPaymentIntent(
      walletAddress,
      req,
    );
    return toPlatformTierPaymentIntentResponse(intent);
  },
);

export const confirmPlatformTierPayment = api(
  {
    method: "POST",
    path: "/me/author/platform-tier-payment-intents/:intentId/confirm",
    expose: true,
    auth: true,
  },
  async ({
    intentId,
    ...req
  }: ConfirmPlatformPaymentPathRequest): Promise<PlatformTierPaymentIntentResponse> => {
    const walletAddress = getRequiredWallet();
    const intent = await service.confirmPlatformTierPayment(
      walletAddress,
      intentId,
      req,
    );
    return toPlatformTierPaymentIntentResponse(intent);
  },
);

export const createPlatformStoragePaymentIntent = api(
  {
    method: "POST",
    path: "/me/author/platform-storage-payment-intents",
    expose: true,
    auth: true,
  },
  async (
    req: CreatePlatformStoragePaymentIntentRequest,
  ): Promise<PlatformStoragePaymentIntentResponse> => {
    const walletAddress = getRequiredWallet();
    const intent = await service.createPlatformStoragePaymentIntent(
      walletAddress,
      req,
    );
    return toPlatformStoragePaymentIntentResponse(intent);
  },
);

export const confirmPlatformStoragePayment = api(
  {
    method: "POST",
    path: "/me/author/platform-storage-payment-intents/:intentId/confirm",
    expose: true,
    auth: true,
  },
  async ({
    intentId,
    ...req
  }: ConfirmPlatformPaymentPathRequest): Promise<PlatformStoragePaymentIntentResponse> => {
    const walletAddress = getRequiredWallet();
    const intent = await service.confirmPlatformStoragePayment(
      walletAddress,
      intentId,
      req,
    );
    return toPlatformStoragePaymentIntentResponse(intent);
  },
);
