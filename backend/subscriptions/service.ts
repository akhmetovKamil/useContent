import { APIError } from "encore.dev/api";
import { id as hashId } from "ethers";
import { ObjectId } from "mongodb";
import { ZERO_ADDRESS } from "../../shared/consts";
import {
  ACCESS_POLICY_VERSION,
  type AccessPolicy,
  type AccessEvaluationContext,
  type AccessPolicyNode,
  createPublicPolicy,
  evaluateAccessPolicy,
  isAccessPolicy,
  resolveEntityPolicy,
} from "../domain/access";
import {
  readOnChainAccessGrants,
  verifyPlatformSubscriptionPayment,
  verifyPlanRegistration,
  verifySubscriptionPayment,
} from "../content/onchain";
import * as accessRepo from "../access/repository";
import * as contractDeploymentsRepo from "../lib/contract-deployments.repository";
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
import type {
  AccessPolicyPresetDoc,
  AccessPolicyConditionResponse,
  AccessPolicyPresetResponse,
  AuthorAccessPolicyResponse,
  AuthorCatalogItemResponse,
  AuthorProfileDoc,
  AuthorProfileResponse,
  AuthorSubscriberResponse,
  AuthorPlatformBillingResponse,
  AuthorPlatformCleanupItemResponse,
  AuthorPlatformCleanupPreviewResponse,
  AuthorPlatformCleanupRunResponse,
  ConfirmSubscriptionPaymentRequest,
  AuthorStorageUsageResponse,
  AuthorStorageUsageStats,
  ContractDeploymentDoc,
  ContractDeploymentResponse,
  CreateAccessPolicyPresetRequest,
  CreateAuthorProfileRequest,
  CreatePlatformSubscriptionPaymentIntentRequest,
  CreatePostRequest,
  CreateProjectFolderRequest,
  CreateProjectRequest,
  CreatePostCommentRequest,
  CreateSubscriptionPaymentIntentRequest,
  FeedPostResponse,
  FeedProjectResponse,
  PostDoc,
  PostCommentDoc,
  PostCommentResponse,
  PostAttachmentDoc,
  PostAttachmentResponse,
  PostResponse,
  ProjectDoc,
  ProjectBundleResponse,
  ProjectNodeDoc,
  ProjectNodeListResponse,
  ProjectNodeResponse,
  ProjectResponse,
  PlatformFeature,
  PlatformPlanResponse,
  PlatformPlanDoc,
  PlatformSubscriptionPaymentIntentDoc,
  PlatformSubscriptionPaymentIntentResponse,
  ReaderSubscriptionResponse,
  SubscriptionPlanDoc,
  SubscriptionPlanResponse,
  SubscriptionEntitlementDoc,
  SubscriptionEntitlementResponse,
  SubscriptionPaymentIntentDoc,
  SubscriptionPaymentIntentResponse,
  UpdateAuthorProfileRequest,
  UpdateAccessPolicyPresetRequest,
  UpsertContractDeploymentRequest,
  UpsertSubscriptionPlanRequest,
  UpdateMyProfileRequest,
  UpdatePostRequest,
  UpdateProjectNodeRequest,
  UpdateProjectRequest,
  UserDoc,
  UserProfileResponse,
} from "../lib/content-types";
import {
  toUserProfileResponse,
  toAuthorProfileResponse,
  toAuthorStorageUsageResponse,
  toAccessPolicyPresetResponse,
  toAccessPolicyPresetResponseWithUsage,
  toSubscriptionEntitlementResponse,
  toContractDeploymentResponse,
  toSubscriptionPaymentIntentResponse,
  toPlatformSubscriptionPaymentIntentResponse,
  toSubscriptionPlanResponse,
  toSubscriptionPlanResponseWithStats,
  toPostResponse,
  toPostAttachmentResponse,
  toPostCommentResponse,
  buildPostResponse,
  toFeedPostResponse,
  buildFeedPostResponse,
  describeAccessPolicy,
  describeAccessPolicyNode,
  toProjectResponse,
  buildProjectResponse,
  toProjectNodeResponse,
  toFeedProjectResponse,
  buildFeedProjectResponse,
  normalizeWallet,
  isMongoDuplicateKeyError,
  normalizePaymentAsset,
  normalizePlanTokenAddress,
  normalizeUsername,
  normalizeDisplayName,
  normalizeBio,
  normalizeAuthorTags,
  normalizeSlug,
  normalizePlanTitle,
  normalizePresetName,
  normalizePresetDescription,
  normalizeChainId,
  normalizeBillingPeriodDays,
  normalizePositiveInteger,
  normalizePostTitle,
  normalizePostContent,
  normalizePostCommentContent,
  normalizeContentPolicy,
  normalizeAccessPolicy,
  normalizeProjectTitle,
  normalizeProjectDescription,
  normalizeProjectNodeName,
  getMyProjectContext,
  resolveProjectNode,
  resolveProjectFolder,
  buildProjectBreadcrumbs,
  buildProjectBundle,
  getReadablePostContext,
  buildPostStats,
  assertPublishedProjectPath,
  readProjectFileObject,
  normalizeRequestedAuthorDefaultPolicy,
  resolveDefaultPolicyFromPreset,
  normalizePresetPolicy,
  normalizeRequestedCustomPolicy,
  resolvePublishedAt,
  normalizeAttachmentIds,
  normalizeLinkedProjectIds,
  resolvePostAttachmentKind,
  resolvePostAttachment,
  readPostAttachmentObject,
  parseObjectId,
  uniqueObjectIds,
  buildSubscriptionGrants,
  buildAccessEvaluationContext,
  policyUsesSubscriptionPlan,
  buildAccessPolicyConditionResponses,
  collectPolicyConditionNodes,
  collectSubscriptionPlanIds,
  getConditionMode,
  shortenWallet,
  buildAccessPolicyFromInput,
  buildAccessPolicyNodeFromInput,
  normalizePlanCode,
  normalizeTokenDecimals,
  normalizeNftStandard,
  normalizeOptionalIdString,
  normalizeTxHash,
  normalizePlanKey,
  buildPlanKey,
  addMinutes,
} from "../lib/content-common";

export * from "../lib/content-common";
import { getAuthorProfileBySlug, getMyAuthorProfile, getOrCreateUserByWallet } from "../profiles/service";
import { recordNewSubscriptionActivity } from "../activity/events";
export async function listMyEntitlements(
  walletAddress: string,
): Promise<SubscriptionEntitlementDoc[]> {
  const normalizedWallet = normalizeWallet(walletAddress);
  return repo.listSubscriptionEntitlementsByWallet(normalizedWallet);
}

export async function listMyReaderSubscriptions(
  walletAddress: string,
): Promise<ReaderSubscriptionResponse[]> {
  const entitlements = await listMyEntitlements(walletAddress);
  const authorIds = uniqueObjectIds(
    entitlements.map((entitlement) => entitlement.authorId),
  );
  const planIds = uniqueObjectIds(
    entitlements.map((entitlement) => entitlement.planId),
  );
  const [authors, plans] = await Promise.all([
    repo.findAuthorProfilesByIds(authorIds),
    Promise.all(planIds.map((planId) => repo.findSubscriptionPlanById(planId))),
  ]);
  const authorById = new Map(
    authors.map((author) => [author._id.toHexString(), author]),
  );
  const planById = new Map(
    plans
      .filter((plan): plan is SubscriptionPlanDoc => Boolean(plan))
      .map((plan) => [plan._id.toHexString(), plan]),
  );

  return entitlements
    .map((entitlement) => {
      const author = authorById.get(entitlement.authorId.toHexString());
      if (!author) {
        return null;
      }
      const plan = planById.get(entitlement.planId.toHexString()) ?? null;

      return {
        ...toSubscriptionEntitlementResponse(entitlement),
        authorSlug: author.slug,
        authorDisplayName: author.displayName,
        planCode: plan?.code ?? null,
        planTitle: plan?.title ?? null,
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
          entitlement.status === "active" &&
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
        accessPolicyNames,
        status:
          entitlement.status === "active" &&
          entitlement.validUntil.getTime() > Date.now()
            ? "active"
            : "expired",
        validUntil: entitlement.validUntil.toISOString(),
        createdAt: entitlement.createdAt.toISOString(),
        updatedAt: entitlement.updatedAt.toISOString(),
      };
    }),
  );
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
  const paymentAsset = normalizePaymentAsset(input.paymentAsset ?? "erc20");
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
    paymentAsset: plan.paymentAsset ?? "erc20",
    chainId: plan.chainId,
    tokenAddress: plan.tokenAddress,
    contractAddress: plan.contractAddress,
    price: plan.price,
    billingPeriodDays: plan.billingPeriodDays,
    status: "pending",
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
  if (intent.status === "expired" || intent.expiresAt.getTime() < Date.now()) {
    const expired = await repo.updateSubscriptionPaymentIntent(intent._id, {
      status: "expired",
      updatedAt: new Date(),
    });
    if (!expired) {
      throw APIError.notFound("subscription payment intent not found");
    }
    return expired;
  }
  if (intent.status === "confirmed") {
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
    paymentAsset: intent.paymentAsset ?? "erc20",
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
    status: "confirmed",
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
