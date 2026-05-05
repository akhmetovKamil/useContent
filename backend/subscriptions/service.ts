import { APIError } from "encore.dev/api";
import {
  PAYMENT_ASSET,
  PAYMENT_INTENT_STATUS,
  SUBSCRIPTION_ENTITLEMENT_STATUS,
} from "../../shared/consts";
import * as accessRepo from "../access/repository";
import * as contractDeploymentsRepo from "../contracts/repository";
import {
  addMinutes,
  buildFeedPostResponse,
  buildPlanKey,
  normalizeBillingPeriodDays,
  normalizeChainId,
  normalizePaymentAsset,
  normalizePlanCode,
  normalizePlanKey,
  normalizePlanTitle,
  normalizePlanTokenAddress,
  normalizePositiveInteger,
  normalizeTxHash,
  normalizeWallet,
  parseObjectId,
  policyUsesSubscriptionPlan,
  toSubscriptionEntitlementResponse,
  uniqueObjectIds,
} from "../lib/content-common";
import type {
  AuthorDashboardResponse,
  AuthorSubscriberResponse,
  ConfirmSubscriptionPaymentRequest,
  ContractDeploymentDoc,
  CreateSubscriptionPaymentIntentRequest,
  FeedPostResponse,
  ReaderDashboardResponse,
  ReaderSubscriptionResponse,
  SubscriptionEntitlementDoc,
  SubscriptionPaymentIntentDoc,
  SubscriptionPlanDoc,
  UpsertContractDeploymentRequest,
  UpsertSubscriptionPlanRequest,
} from "../lib/content-types";
import { verifyPlanRegistration, verifySubscriptionPayment } from "../onchain";
import * as platformRepo from "../platform/repository";
import * as postsRepo from "../posts/repository";
import * as profilesRepo from "../profiles/repository";
import * as projectsRepo from "../projects/repository";
import * as subscriptionsRepo from "../subscriptions/repository";

const repo = {
  ...accessRepo,
  ...contractDeploymentsRepo,
  ...platformRepo,
  ...postsRepo,
  ...profilesRepo,
  ...projectsRepo,
  ...subscriptionsRepo,
};

import { recordNewSubscriptionActivity } from "../activity/events";
import {
  getAuthorProfileBySlug,
  getMyAuthorProfile,
} from "../profiles/service";
export async function listMyEntitlements(
  walletAddress: string,
): Promise<SubscriptionEntitlementDoc[]> {
  const normalizedWallet = normalizeWallet(walletAddress);
  return repo.listSubscriptionEntitlementsByWallet(normalizedWallet);
}

export async function listMyReaderSubscriptions(
  walletAddress: string,
): Promise<ReaderSubscriptionResponse[]> {
  const normalizedWallet = normalizeWallet(walletAddress);
  const entitlements = await listMyEntitlements(normalizedWallet);
  const authorIds = uniqueObjectIds(
    entitlements.map((entitlement) => entitlement.authorId),
  );
  const planIds = uniqueObjectIds(
    entitlements.map((entitlement) => entitlement.planId),
  );
  const [authors, plans, confirmedPayments] = await Promise.all([
    repo.findAuthorProfilesByIds(authorIds),
    Promise.all(planIds.map((planId) => repo.findSubscriptionPlanById(planId))),
    repo.listConfirmedSubscriptionPaymentIntentsByWallet(normalizedWallet),
  ]);
  const authorById = new Map(
    authors.map((author) => [author._id.toHexString(), author]),
  );
  const planById = new Map(
    plans
      .filter((plan): plan is SubscriptionPlanDoc => Boolean(plan))
      .map((plan) => [plan._id.toHexString(), plan]),
  );
  const lastPaymentByPlanId = new Map<string, SubscriptionPaymentIntentDoc>();
  for (const payment of confirmedPayments) {
    const planId = payment.planId.toHexString();
    const existing = lastPaymentByPlanId.get(planId);
    if (!existing || existing.updatedAt.getTime() < payment.updatedAt.getTime()) {
      lastPaymentByPlanId.set(planId, payment);
    }
  }

  return entitlements
    .map((entitlement) => {
      const author = authorById.get(entitlement.authorId.toHexString());
      if (!author) {
        return null;
      }
      const plan = planById.get(entitlement.planId.toHexString()) ?? null;
      const lastPayment =
        lastPaymentByPlanId.get(entitlement.planId.toHexString()) ?? null;

      return {
        ...toSubscriptionEntitlementResponse(entitlement),
        authorSlug: author.slug,
        authorDisplayName: author.displayName,
        planCode: plan?.code ?? null,
        planTitle: plan?.title ?? null,
        paymentAsset: plan?.paymentAsset ?? null,
        chainId: plan?.chainId ?? null,
        tokenAddress: plan?.tokenAddress ?? null,
        price: plan?.price ?? null,
        billingPeriodDays: plan?.billingPeriodDays ?? null,
        lastPaymentAt: lastPayment?.updatedAt.toISOString() ?? null,
      };
    })
    .filter((subscription): subscription is ReaderSubscriptionResponse =>
      Boolean(subscription),
    );
}

export async function listMyFeedPosts(
  walletAddress: string,
): Promise<FeedPostResponse[]> {
  const normalizedWallet = normalizeWallet(walletAddress);
  const entitlements = await listMyEntitlements(normalizedWallet);
  const activeAuthorIds = uniqueObjectIds(
    entitlements
      .filter(
        (entitlement) =>
          entitlement.status === SUBSCRIPTION_ENTITLEMENT_STATUS.ACTIVE &&
          entitlement.validUntil.getTime() > Date.now(),
      )
      .map((entitlement) => entitlement.authorId),
  );
  if (!activeAuthorIds.length) {
    return [];
  }

  const [authors, posts] = await Promise.all([
    repo.findAuthorProfilesByIds(activeAuthorIds),
    repo.listPublishedPostsByAuthorIds(activeAuthorIds),
  ]);
  const authorById = new Map(
    authors.map((author) => [author._id.toHexString(), author]),
  );

  const feedPosts = await Promise.all(
    posts.map(async (post) => {
      const author = authorById.get(post.authorId.toHexString());
      if (!author) {
        return null;
      }

      return buildFeedPostResponse(post, author, normalizedWallet);
    }),
  );

  return feedPosts.filter((post): post is FeedPostResponse => Boolean(post));
}

export async function getMyReaderDashboard(
  walletAddress: string,
): Promise<ReaderDashboardResponse> {
  const normalizedWallet = normalizeWallet(walletAddress);
  const [subscriptions, confirmedPayments] = await Promise.all([
    listMyReaderSubscriptions(normalizedWallet),
    repo.listConfirmedSubscriptionPaymentIntentsByWallet(normalizedWallet),
  ]);
  const now = new Date();
  const expiringSoonAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const activeSubscriptions = subscriptions.filter((subscription) =>
    isEntitlementActive(subscription.status, subscription.validUntil, now),
  );
  const expiredSubscriptions = subscriptions.filter(
    (subscription) =>
      !isEntitlementActive(subscription.status, subscription.validUntil, now),
  );
  const upcomingExpirations = activeSubscriptions
    .filter((subscription) => new Date(subscription.validUntil) <= expiringSoonAt)
    .sort(
      (left, right) =>
        new Date(left.validUntil).getTime() -
        new Date(right.validUntil).getTime(),
    )
    .slice(0, 6);

  return {
    counts: {
      activeSubscriptions: activeSubscriptions.length,
      expiredSubscriptions: expiredSubscriptions.length,
      paidAuthors: new Set(
        subscriptions.map((subscription) => subscription.authorId),
      ).size,
      expiringSoon: upcomingExpirations.length,
    },
    spendByAsset: buildRevenueAssets(confirmedPayments),
    upcomingExpirations,
    subscriptionsByAuthor: subscriptions,
  };
}

export async function listMyAuthorSubscribers(
  walletAddress: string,
): Promise<AuthorSubscriberResponse[]> {
  const author = await getMyAuthorProfile(walletAddress);
  const [entitlements, plans, policies] = await Promise.all([
    repo.listSubscriptionEntitlementsByAuthorId(author._id),
    repo.listSubscriptionPlansByAuthorId(author._id),
    repo.listAccessPolicyPresetsByAuthorId(author._id),
  ]);
  const planById = new Map(plans.map((plan) => [plan._id.toHexString(), plan]));

  return Promise.all(
    entitlements.map(async (entitlement) => {
      const plan = planById.get(entitlement.planId.toHexString()) ?? null;
      const user = await repo.findUserByPrimaryWallet(
        entitlement.subscriberWallet,
      );
      const planId = entitlement.planId.toHexString();
      const planCode = plan?.code ?? null;
      const accessPolicyNames = plan
        ? policies
            .filter((policy) =>
              policyUsesSubscriptionPlan(policy.policy.root, planId),
            )
            .map((policy) => policy.name)
        : [];

      return {
        id: entitlement._id.toHexString(),
        subscriberWallet: entitlement.subscriberWallet,
        subscriberDisplayName: user?.displayName ?? null,
        subscriberUsername: user?.username ?? null,
        planId,
        planCode,
        planTitle: plan?.title ?? null,
        paymentAsset: plan?.paymentAsset ?? null,
        chainId: plan?.chainId ?? null,
        tokenAddress: plan?.tokenAddress ?? null,
        price: plan?.price ?? null,
        billingPeriodDays: plan?.billingPeriodDays ?? null,
        accessPolicyNames,
        status:
          entitlement.status === SUBSCRIPTION_ENTITLEMENT_STATUS.ACTIVE &&
          entitlement.validUntil.getTime() > Date.now()
            ? SUBSCRIPTION_ENTITLEMENT_STATUS.ACTIVE
            : SUBSCRIPTION_ENTITLEMENT_STATUS.EXPIRED,
        validUntil: entitlement.validUntil.toISOString(),
        createdAt: entitlement.createdAt.toISOString(),
        updatedAt: entitlement.updatedAt.toISOString(),
      };
    }),
  );
}

export async function getMyAuthorDashboard(
  walletAddress: string,
): Promise<AuthorDashboardResponse> {
  const author = await getMyAuthorProfile(walletAddress);
  const now = new Date();
  const [
    entitlements,
    plans,
    subscribers,
    confirmedPayments,
    postsCount,
    projectsCount,
  ] = await Promise.all([
    repo.listSubscriptionEntitlementsByAuthorId(author._id),
    repo.listSubscriptionPlansByAuthorId(author._id),
    listMyAuthorSubscribers(walletAddress),
    repo.listConfirmedSubscriptionPaymentIntentsByAuthorId(author._id),
    repo.countPostsByAuthorId(author._id),
    repo.countProjectsByAuthorId(author._id),
  ]);
  const planById = new Map(plans.map((plan) => [plan._id.toHexString(), plan]));
  const activeEntitlements = entitlements.filter((entitlement) =>
    isEntitlementActive(
      entitlement.status,
      entitlement.validUntil.toISOString(),
      now,
    ),
  );
  const expiredEntitlements = entitlements.filter(
    (entitlement) =>
      !isEntitlementActive(
        entitlement.status,
        entitlement.validUntil.toISOString(),
        now,
      ),
  );
  const activeWallets = new Set(
    activeEntitlements.map((entitlement) => entitlement.subscriberWallet),
  );
  const expiredWallets = new Set(
    expiredEntitlements.map((entitlement) => entitlement.subscriberWallet),
  );

  return {
    counts: {
      posts: postsCount,
      projects: projectsCount,
      uniqueSubscribers: new Set(
        entitlements.map((entitlement) => entitlement.subscriberWallet),
      ).size,
      activeSubscribers: activeWallets.size,
      expiredSubscribers: Array.from(expiredWallets).filter(
        (wallet) => !activeWallets.has(wallet),
      ).length,
    },
    planBreakdown: plans.map((plan) => {
      const planActiveEntitlements = activeEntitlements.filter((entitlement) =>
        entitlement.planId.equals(plan._id),
      );
      const planExpiredEntitlements = expiredEntitlements.filter((entitlement) =>
        entitlement.planId.equals(plan._id),
      );
      const planEntitlements = entitlements.filter((entitlement) =>
        entitlement.planId.equals(plan._id),
      );

      return {
        planId: plan._id.toHexString(),
        planCode: plan.code,
        planTitle: plan.title,
        paymentAsset: plan.paymentAsset,
        chainId: plan.chainId,
        tokenAddress: plan.tokenAddress,
        price: plan.price,
        billingPeriodDays: plan.billingPeriodDays,
        activeSubscribers: new Set(
          planActiveEntitlements.map((entitlement) => entitlement.subscriberWallet),
        ).size,
        expiredSubscribers: new Set(
          planExpiredEntitlements.map((entitlement) => entitlement.subscriberWallet),
        ).size,
        totalSubscribers: new Set(
          planEntitlements.map((entitlement) => entitlement.subscriberWallet),
        ).size,
        activeRevenueByAsset: buildActiveRevenueAssets(
          planActiveEntitlements,
          planById,
        ),
      };
    }),
    activeRevenueByAsset: buildActiveRevenueAssets(
      activeEntitlements,
      planById,
    ),
    revenueSeries: {
      month: buildRevenueSeries(confirmedPayments, "day", now),
      year: buildRevenueSeries(confirmedPayments, "month", now),
    },
    recentSubscribers: subscribers.slice(0, 8).map((subscriber) => ({
      id: subscriber.id,
      subscriberWallet: subscriber.subscriberWallet,
      subscriberDisplayName: subscriber.subscriberDisplayName,
      subscriberUsername: subscriber.subscriberUsername,
      planId: subscriber.planId,
      planCode: subscriber.planCode,
      planTitle: subscriber.planTitle,
      status: subscriber.status,
      validUntil: subscriber.validUntil,
      createdAt: subscriber.createdAt,
    })),
  };
}

export async function getSubscriptionManagerDeployment(
  chainId: number,
): Promise<ContractDeploymentDoc | null> {
  return repo.findContractDeployment(
    normalizeChainId(chainId),
    "SubscriptionManager",
  );
}

export async function getPlatformSubscriptionManagerDeployment(
  chainId: number,
): Promise<ContractDeploymentDoc | null> {
  return repo.findContractDeployment(
    normalizeChainId(chainId),
    "PlatformSubscriptionManager",
  );
}

export async function upsertContractDeployment(
  input: UpsertContractDeploymentRequest,
): Promise<ContractDeploymentDoc> {
  const now = new Date();
  return repo.upsertContractDeployment(
    {
      chainId: normalizeChainId(input.chainId),
      contractName: input.contractName,
      address: normalizeWallet(input.address),
      platformTreasury: normalizeWallet(input.platformTreasury),
      deployedBy: normalizeWallet(input.deployedBy),
      deploymentTxHash:
        input.deploymentTxHash === undefined || input.deploymentTxHash === null
          ? null
          : normalizeTxHash(input.deploymentTxHash),
    },
    now,
  );
}

export async function listMySubscriptionPlans(
  walletAddress: string,
): Promise<SubscriptionPlanDoc[]> {
  const author = await getMyAuthorProfile(walletAddress);
  return repo.listSubscriptionPlansByAuthorId(author._id);
}

export async function listAuthorSubscriptionPlansBySlug(
  slug: string,
): Promise<SubscriptionPlanDoc[]> {
  const author = await getAuthorProfileBySlug(slug);
  return repo.listActiveSubscriptionPlansByAuthorId(author._id);
}

export async function upsertMySubscriptionPlan(
  walletAddress: string,
  input: UpsertSubscriptionPlanRequest,
): Promise<SubscriptionPlanDoc> {
  const author = await getMyAuthorProfile(walletAddress);
  const now = new Date();
  const code = normalizePlanCode(input.code ?? "main");
  const title = normalizePlanTitle(input.title);
  const paymentAsset = normalizePaymentAsset(
    input.paymentAsset ?? PAYMENT_ASSET.ERC20,
  );
  const chainId = normalizeChainId(input.chainId);
  const tokenAddress = normalizePlanTokenAddress(
    paymentAsset,
    input.tokenAddress,
  );
  const price = normalizePositiveInteger(input.price, "price");
  const billingPeriodDays = normalizeBillingPeriodDays(input.billingPeriodDays);
  const contractAddress = normalizeWallet(input.contractAddress);
  const planKey = normalizePlanKey(
    input.planKey ?? buildPlanKey(author._id.toHexString(), code, chainId),
  );
  const registrationTxHash =
    input.registrationTxHash === undefined || input.registrationTxHash === null
      ? null
      : normalizeTxHash(input.registrationTxHash);
  const active = input.active ?? true;

  if (registrationTxHash) {
    await verifyPlanRegistration({
      authorWallet: walletAddress,
      chainId,
      contractAddress,
      planKey,
      paymentAsset,
      tokenAddress,
      price,
      billingPeriodDays,
      active,
      txHash: registrationTxHash,
    });
  }

  const existing = await repo.findSubscriptionPlanByAuthorIdAndCode(
    author._id,
    code,
  );
  if (existing) {
    const updated = await repo.updateSubscriptionPlan(existing._id, {
      title,
      paymentAsset,
      chainId,
      tokenAddress,
      price,
      billingPeriodDays,
      contractAddress,
      planKey,
      registrationTxHash:
        registrationTxHash ?? existing.registrationTxHash ?? null,
      active,
      updatedAt: now,
    });
    if (!updated) {
      throw APIError.notFound("subscription plan not found");
    }
    return updated;
  }

  const created = await repo.createSubscriptionPlan({
    authorId: author._id,
    code,
    title,
    paymentAsset,
    chainId,
    tokenAddress,
    price,
    billingPeriodDays,
    contractAddress,
    planKey,
    registrationTxHash,
    active,
    createdAt: now,
    updatedAt: now,
  });

  if (code === "main" || !author.subscriptionPlanId) {
    await repo.updateAuthorProfile(author._id, {
      subscriptionPlanId: created._id,
      updatedAt: now,
    });
  }

  return created;
}

export async function deleteMySubscriptionPlan(
  walletAddress: string,
  planId: string,
): Promise<void> {
  const author = await getMyAuthorProfile(walletAddress);
  const objectId = parseObjectId(planId, "planId");
  const plan = await repo.findSubscriptionPlanById(objectId);
  if (!plan || !plan.authorId.equals(author._id)) {
    throw APIError.notFound("subscription plan not found");
  }

  const activeEntitlements =
    await repo.countActiveSubscriptionEntitlementsByPlanId(
      objectId,
      new Date(),
    );
  if (activeEntitlements > 0) {
    throw APIError.failedPrecondition(
      "subscription plan has active subscribers",
    );
  }

  const deleted = await repo.deleteSubscriptionPlanByIdAndAuthorId(
    objectId,
    author._id,
  );
  if (!deleted) {
    throw APIError.notFound("subscription plan not found");
  }
}

export async function createSubscriptionPaymentIntent(
  walletAddress: string,
  slug: string,
  input: CreateSubscriptionPaymentIntentRequest,
): Promise<SubscriptionPaymentIntentDoc> {
  const subscriberWallet = normalizeWallet(walletAddress);
  const author = await getAuthorProfileBySlug(slug);
  const planCode = normalizePlanCode(input.planCode ?? "main");
  const plan = await repo.findSubscriptionPlanByAuthorIdAndCode(
    author._id,
    planCode,
  );
  if (!plan || !plan.active) {
    throw APIError.notFound("subscription plan not found");
  }

  const now = new Date();
  return repo.createSubscriptionPaymentIntent({
    authorId: author._id,
    subscriberWallet,
    planId: plan._id,
    planCode: plan.code,
    planKey:
      plan.planKey ??
      buildPlanKey(plan.authorId.toHexString(), plan.code, plan.chainId),
    paymentAsset: plan.paymentAsset ?? PAYMENT_ASSET.ERC20,
    chainId: plan.chainId,
    tokenAddress: plan.tokenAddress,
    contractAddress: plan.contractAddress,
    price: plan.price,
    billingPeriodDays: plan.billingPeriodDays,
    status: PAYMENT_INTENT_STATUS.PENDING,
    txHash: null,
    entitlementId: null,
    paidUntil: null,
    expiresAt: addMinutes(now, 30),
    createdAt: now,
    updatedAt: now,
  });
}

export async function confirmSubscriptionPayment(
  walletAddress: string,
  intentId: string,
  input: ConfirmSubscriptionPaymentRequest,
): Promise<SubscriptionPaymentIntentDoc> {
  const subscriberWallet = normalizeWallet(walletAddress);
  const txHash = normalizeTxHash(input.txHash);
  const intent = await repo.findSubscriptionPaymentIntentByIdAndWallet(
    parseObjectId(intentId, "intentId"),
    subscriberWallet,
  );
  if (!intent) {
    throw APIError.notFound("subscription payment intent not found");
  }
  if (intent.status === "cancelled") {
    throw APIError.failedPrecondition(
      "subscription payment intent is cancelled",
    );
  }
  if (
    intent.status === PAYMENT_INTENT_STATUS.EXPIRED ||
    intent.expiresAt.getTime() < Date.now()
  ) {
    const expired = await repo.updateSubscriptionPaymentIntent(intent._id, {
      status: PAYMENT_INTENT_STATUS.EXPIRED,
      updatedAt: new Date(),
    });
    if (!expired) {
      throw APIError.notFound("subscription payment intent not found");
    }
    return expired;
  }
  if (intent.status === PAYMENT_INTENT_STATUS.CONFIRMED) {
    return intent;
  }

  const existingTx = await repo.findSubscriptionPaymentIntentByTxHash(txHash);
  if (existingTx && !existingTx._id.equals(intent._id)) {
    throw APIError.alreadyExists(
      "transaction hash is already attached to payment",
    );
  }

  const payment = await verifySubscriptionPayment({
    subscriberWallet,
    chainId: intent.chainId,
    contractAddress: intent.contractAddress,
    planKey: intent.planKey,
    paymentAsset: intent.paymentAsset ?? PAYMENT_ASSET.ERC20,
    tokenAddress: intent.tokenAddress,
    price: intent.price,
    txHash,
  });
  const now = new Date();
  const entitlement = await repo.upsertActiveSubscriptionEntitlement({
    authorId: intent.authorId,
    subscriberWallet,
    planId: intent.planId,
    validUntil: payment.paidUntil,
    now,
  });
  await recordNewSubscriptionActivity({
    authorId: intent.authorId,
    planCode: intent.planCode,
    subscriberWallet,
  });

  const updated = await repo.updateSubscriptionPaymentIntent(intent._id, {
    status: PAYMENT_INTENT_STATUS.CONFIRMED,
    txHash,
    entitlementId: entitlement._id,
    paidUntil: payment.paidUntil,
    updatedAt: now,
  });

  if (!updated) {
    throw APIError.notFound("subscription payment intent not found");
  }

  return updated;
}

export async function listMySubscriptionPaymentIntents(
  walletAddress: string,
): Promise<SubscriptionPaymentIntentDoc[]> {
  return repo.listSubscriptionPaymentIntentsByWallet(
    normalizeWallet(walletAddress),
  );
}

function isEntitlementActive(
  status: string,
  validUntil: string,
  now: Date,
): boolean {
  return (
    status === SUBSCRIPTION_ENTITLEMENT_STATUS.ACTIVE &&
    new Date(validUntil).getTime() > now.getTime()
  );
}

function buildRevenueAssets(payments: SubscriptionPaymentIntentDoc[]) {
  return buildRevenueAssetBuckets(payments);
}

function buildActiveRevenueAssets(
  entitlements: SubscriptionEntitlementDoc[],
  plansById: Map<string, SubscriptionPlanDoc>,
) {
  const payments = entitlements
    .map((entitlement) => {
      const plan = plansById.get(entitlement.planId.toHexString());
      if (!plan) {
        return null;
      }

      return {
        chainId: plan.chainId,
        paymentAsset: plan.paymentAsset,
        tokenAddress: plan.tokenAddress,
        price: plan.price,
      };
    })
    .filter(
      (
        payment,
      ): payment is Pick<
        SubscriptionPaymentIntentDoc,
        "chainId" | "paymentAsset" | "tokenAddress" | "price"
      > => Boolean(payment),
    );

  return buildRevenueAssetBuckets(payments);
}

function buildRevenueAssetBuckets(
  payments: Array<
    Pick<
      SubscriptionPaymentIntentDoc,
      "chainId" | "paymentAsset" | "tokenAddress" | "price"
    >
  >,
) {
  const buckets = new Map<
    string,
    {
      chainId: number;
      paymentAsset: SubscriptionPaymentIntentDoc["paymentAsset"];
      tokenAddress: string;
      gross: bigint;
      confirmedPayments: number;
    }
  >();

  for (const payment of payments) {
    const key = getAssetKey(payment);
    const existing =
      buckets.get(key) ??
      {
        chainId: payment.chainId,
        paymentAsset: payment.paymentAsset ?? PAYMENT_ASSET.ERC20,
        tokenAddress: payment.tokenAddress,
        gross: 0n,
        confirmedPayments: 0,
      };
    existing.gross += BigInt(payment.price);
    existing.confirmedPayments += 1;
    buckets.set(key, existing);
  }

  return Array.from(buckets.values()).map((bucket) => {
    const platformFee = (bucket.gross * 20n) / 100n;
    const net = bucket.gross - platformFee;

    return {
      chainId: bucket.chainId,
      paymentAsset: bucket.paymentAsset,
      tokenAddress: bucket.tokenAddress,
      grossAmount: bucket.gross.toString(),
      netAmount: net.toString(),
      platformFeeAmount: platformFee.toString(),
      confirmedPayments: bucket.confirmedPayments,
    };
  });
}

function buildRevenueSeries(
  payments: SubscriptionPaymentIntentDoc[],
  bucket: "day" | "month",
  now: Date,
) {
  const filteredPayments = payments.filter((payment) => {
    if (bucket === "month") {
      return payment.updatedAt.getUTCFullYear() === now.getUTCFullYear();
    }

    const start = new Date(now);
    start.setUTCDate(now.getUTCDate() - 29);
    start.setUTCHours(0, 0, 0, 0);
    return payment.updatedAt >= start;
  });
  const periodMap = new Map<string, SubscriptionPaymentIntentDoc[]>();

  for (const payment of filteredPayments) {
    const period =
      bucket === "month"
        ? payment.updatedAt.toISOString().slice(0, 7)
        : payment.updatedAt.toISOString().slice(0, 10);
    periodMap.set(period, [...(periodMap.get(period) ?? []), payment]);
  }

  return Array.from(periodMap.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([period, periodPayments]) => ({
      period,
      assets: buildRevenueAssets(periodPayments),
    }));
}

function getAssetKey(
  payment: Pick<
    SubscriptionPaymentIntentDoc,
    "chainId" | "paymentAsset" | "tokenAddress"
  >,
): string {
  return [
    payment.chainId,
    payment.paymentAsset ?? PAYMENT_ASSET.ERC20,
    payment.tokenAddress.toLowerCase(),
  ].join(":");
}
