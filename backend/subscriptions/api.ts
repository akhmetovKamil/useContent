import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";
import {
  assertDeploymentRegistryToken,
  getRequiredWallet,
} from "../lib/api-helpers";
import {
  toContractDeploymentResponse,
  toSubscriptionEntitlementResponse,
  toSubscriptionPaymentIntentResponse,
  toSubscriptionPlanResponseWithStats,
} from "../lib/content-common";
import * as service from "./service";
import type {
  AuthorSubscriberResponse,
  ConfirmSubscriptionPaymentPathRequest,
  ContractDeploymentChainRequest,
  ContractDeploymentLookupResponse,
  ContractDeploymentResponse,
  CreateSubscriptionPaymentIntentPathRequest,
  DeleteSubscriptionPlanRequest,
  ListAuthorSubscriptionPlansRequest,
  ReaderSubscriptionResponse,
  SubscriptionEntitlementResponse,
  SubscriptionPaymentIntentResponse,
  SubscriptionPlanResponse,
  UpsertContractDeploymentRegistryRequest,
  UpsertSubscriptionPlanRequest,
} from "./types";
import type { ListAuthorSubscribersResponseDto, ListEntitlementsResponseDto, ListReaderSubscriptionsResponseDto, ListSubscriptionPaymentIntentsResponseDto, ListSubscriptionPlansResponseDto } from "../../shared/types/responses"

const deploymentRegistryTokenSecret = secret("DeploymentRegistryToken");

export const listMyEntitlements = api(
  { method: "GET", path: "/me/entitlements", expose: true, auth: true },
  async (): Promise<ListEntitlementsResponseDto> => {
    const walletAddress = getRequiredWallet();
    const entitlements = await service.listMyEntitlements(walletAddress);
    return {
      entitlements: entitlements.map(toSubscriptionEntitlementResponse),
    };
  },
);

export const listMyReaderSubscriptions = api(
  { method: "GET", path: "/me/subscriptions", expose: true, auth: true },
  async (): Promise<ListReaderSubscriptionsResponseDto> => {
    const walletAddress = getRequiredWallet();
    const subscriptions =
      await service.listMyReaderSubscriptions(walletAddress);
    return { subscriptions };
  },
);

export const listMyAuthorSubscribers = api(
  { method: "GET", path: "/me/author/subscribers", expose: true, auth: true },
  async (): Promise<ListAuthorSubscribersResponseDto> => {
    const walletAddress = getRequiredWallet();
    const subscribers = await service.listMyAuthorSubscribers(walletAddress);
    return { subscribers };
  },
);

export const getSubscriptionManagerDeployment = api(
  {
    method: "GET",
    path: "/contract-deployments/subscription-manager/:chainId",
    expose: true,
  },
  async ({
    chainId,
  }: ContractDeploymentChainRequest): Promise<ContractDeploymentLookupResponse> => {
    const deployment = await service.getSubscriptionManagerDeployment(
      Number(chainId),
    );
    return {
      deployment: deployment ? toContractDeploymentResponse(deployment) : null,
    };
  },
);

export const upsertContractDeployment = api(
  {
    method: "PUT",
    path: "/admin/contract-deployments",
    expose: true,
  },
  async ({
    deploymentRegistryToken,
    ...req
  }: UpsertContractDeploymentRegistryRequest): Promise<ContractDeploymentResponse> => {
    assertDeploymentRegistryToken(
      deploymentRegistryTokenSecret(),
      deploymentRegistryToken,
    );
    const deployment = await service.upsertContractDeployment(req);
    return toContractDeploymentResponse(deployment);
  },
);

export const listMySubscriptionPaymentIntents = api(
  {
    method: "GET",
    path: "/me/subscription-payment-intents",
    expose: true,
    auth: true,
  },
  async (): Promise<ListSubscriptionPaymentIntentsResponseDto> => {
    const walletAddress = getRequiredWallet();
    const intents =
      await service.listMySubscriptionPaymentIntents(walletAddress);
    return {
      intents: intents.map(toSubscriptionPaymentIntentResponse),
    };
  },
);

export const listMySubscriptionPlans = api(
  { method: "GET", path: "/me/subscription-plans", expose: true, auth: true },
  async (): Promise<ListSubscriptionPlansResponseDto> => {
    const walletAddress = getRequiredWallet();
    const plans = await service.listMySubscriptionPlans(walletAddress);
    return {
      plans: await Promise.all(
        plans.map((plan) => toSubscriptionPlanResponseWithStats(plan)),
      ),
    };
  },
);

export const upsertMySubscriptionPlan = api(
  { method: "PUT", path: "/me/subscription-plans", expose: true, auth: true },
  async (
    req: UpsertSubscriptionPlanRequest,
  ): Promise<SubscriptionPlanResponse> => {
    const walletAddress = getRequiredWallet();
    const plan = await service.upsertMySubscriptionPlan(walletAddress, req);
    return toSubscriptionPlanResponseWithStats(plan);
  },
);

export const deleteMySubscriptionPlan = api(
  {
    method: "DELETE",
    path: "/me/subscription-plans/:planId",
    expose: true,
    auth: true,
  },
  async ({ planId }: DeleteSubscriptionPlanRequest): Promise<void> => {
    const walletAddress = getRequiredWallet();
    await service.deleteMySubscriptionPlan(walletAddress, planId);
  },
);

export const listAuthorSubscriptionPlans = api(
  { method: "GET", path: "/authors/:slug/subscription-plans", expose: true },
  async ({
    slug,
  }: ListAuthorSubscriptionPlansRequest): Promise<ListSubscriptionPlansResponseDto> => {
    const plans = await service.listAuthorSubscriptionPlansBySlug(slug);
    return {
      plans: await Promise.all(
        plans.map((plan) => toSubscriptionPlanResponseWithStats(plan)),
      ),
    };
  },
);

export const createSubscriptionPaymentIntent = api(
  {
    method: "POST",
    path: "/authors/:slug/subscription-payment-intents",
    expose: true,
    auth: true,
  },
  async ({
    slug,
    ...req
  }: CreateSubscriptionPaymentIntentPathRequest): Promise<SubscriptionPaymentIntentResponse> => {
    const walletAddress = getRequiredWallet();
    const intent = await service.createSubscriptionPaymentIntent(
      walletAddress,
      slug,
      req,
    );
    return toSubscriptionPaymentIntentResponse(intent);
  },
);

export const confirmSubscriptionPayment = api(
  {
    method: "POST",
    path: "/me/subscription-payment-intents/:intentId/confirm",
    expose: true,
    auth: true,
  },
  async ({
    intentId,
    ...req
  }: ConfirmSubscriptionPaymentPathRequest): Promise<SubscriptionPaymentIntentResponse> => {
    const walletAddress = getRequiredWallet();
    const intent = await service.confirmSubscriptionPayment(
      walletAddress,
      intentId,
      req,
    );
    return toSubscriptionPaymentIntentResponse(intent);
  },
);
