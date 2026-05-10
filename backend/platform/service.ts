import { APIError } from "encore.dev/api";
import { id as hashId } from "ethers";
import { ObjectId } from "mongodb";
import {
  CLEANUP_ITEM_KIND,
  CLEANUP_RUN_STATUS,
  PAYMENT_ASSET,
  PAYMENT_INTENT_STATUS,
  PLATFORM_BILLING_STATUS,
  PLATFORM_FEATURE,
  PLATFORM_PLAN_CODE,
  type PlatformBillingStatus,
} from "../../shared/consts";
import { getPlatformUsdcToken } from "../../shared/utils/platform-usdc";
import { shortenWalletAddress } from "../../shared/utils/web3";
import * as accessRepo from "../access/repository";
import * as contractDeploymentsRepo from "../contracts/repository";
import {
  addMinutes,
  normalizeBio,
  normalizeChainId,
  normalizeDisplayName,
  normalizePlanTokenAddress,
  normalizeSlug,
  normalizeTxHash,
  normalizeUsername,
  normalizeWallet,
  parseObjectId,
  toAuthorProfileResponse,
  toAuthorStorageUsageResponse,
} from "../lib/content-common";
import type {
  AuthorCatalogItemResponse,
  AuthorPlatformBillingResponse,
  AuthorPlatformCleanupItemResponse,
  AuthorPlatformCleanupPreviewResponse,
  AuthorPlatformCleanupRunResponse,
  AuthorProfileDoc,
  AuthorStorageUsageResponse,
  AuthorStorageUsageStats,
  ConfirmSubscriptionPaymentRequest,
  ContractDeploymentDoc,
  CreatePlatformStoragePaymentIntentRequest,
  CreatePlatformTierPaymentIntentRequest,
  PlatformFeature,
  PlatformPlanDoc,
  PlatformPlanResponse,
  PlatformStoragePaymentIntentDoc,
  PlatformTierPaymentIntentDoc,
  UpdateMyProfileRequest,
  UserDoc,
} from "../lib/content-types";
import { verifyPlatformStoragePayment, verifyPlatformTierPayment } from "../onchain";
import * as platformRepo from "../platform/repository";
import * as postsRepo from "../posts/repository";
import * as profilesRepo from "../profiles/repository";
import * as projectsRepo from "../projects/repository";
import { deleteObject } from "../storage/object-storage";
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

import { getMyAuthorProfile } from "../profiles/service";
const GIB = 1024 * 1024 * 1024;
const PLATFORM_GRACE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000;

const platformPlans: PlatformPlanDoc[] = [
  {
    code: PLATFORM_PLAN_CODE.FREE,
    title: "Free",
    description: "Start publishing posts with a small storage quota.",
    priceUsdCents: 0,
    billingPeriodDays: 30,
    baseStorageBytes: GIB,
    maxExtraStorageBytes: 0,
    pricePerExtraGbUsdCents: 0,
    features: [PLATFORM_FEATURE.POSTS],
    active: true,
    sortOrder: 1,
  },
  {
    code: PLATFORM_PLAN_CODE.BASIC,
    title: "Basic",
    description: "Unlock projects and future homepage promotion tools.",
    priceUsdCents: 500,
    billingPeriodDays: 30,
    baseStorageBytes: 3 * GIB,
    maxExtraStorageBytes: 10 * GIB,
    pricePerExtraGbUsdCents: 100,
    features: [
      PLATFORM_FEATURE.POSTS,
      PLATFORM_FEATURE.PROJECTS,
      PLATFORM_FEATURE.HOMEPAGE_PROMO,
    ],
    active: true,
    sortOrder: 2,
  },
];

export async function getOrCreateUserByWallet(
  walletAddress: string,
): Promise<UserDoc> {
  const normalizedWallet = normalizeWallet(walletAddress);
  const existing = await repo.findUserByPrimaryWallet(normalizedWallet);
  if (existing) {
    return existing;
  }

  const now = new Date();
  return repo.createUser({
    username: null,
    displayName: shortenWalletAddress(normalizedWallet),
    bio: "",
    avatarFileId: null,
    primaryWallet: normalizedWallet,
    wallets: [
      {
        address: normalizedWallet,
        kind: "primary",
        addedAt: now,
      },
    ],
    role: "user",
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateMyProfile(
  walletAddress: string,
  update: UpdateMyProfileRequest,
): Promise<UserDoc> {
  const user = await getOrCreateUserByWallet(walletAddress);

  const nextUsername =
    update.username === undefined
      ? user.username
      : normalizeUsername(update.username);
  const nextDisplayName =
    update.displayName === undefined
      ? user.displayName
      : normalizeDisplayName(update.displayName);
  const nextBio =
    update.bio === undefined ? user.bio : normalizeBio(update.bio);

  const updated = await repo.updateUser(user._id, {
    username: nextUsername,
    displayName: nextDisplayName,
    bio: nextBio,
    updatedAt: new Date(),
  });

  if (!updated) {
    throw APIError.notFound("user not found");
  }

  return updated;
}

export async function getAuthorProfileBySlug(
  slug: string,
): Promise<AuthorProfileDoc> {
  const author = await repo.findAuthorProfileBySlug(normalizeSlug(slug));
  if (!author) {
    throw APIError.notFound("author profile not found");
  }
  return author;
}

export async function listAuthors(
  search?: string,
): Promise<AuthorCatalogItemResponse[]> {
  const authors = await repo.listAuthorProfiles(search);
  return Promise.all(
    authors.map(async (author) => {
      const [postsCount, plans] = await Promise.all([
        repo.countPublishedPostsByAuthorId(author._id),
        repo.listActiveSubscriptionPlansByAuthorId(author._id),
      ]);

      return {
        ...toAuthorProfileResponse(author),
        postsCount,
        subscriptionPlansCount: plans.length,
      };
    }),
  );
}

export async function getMyAuthorStorageUsage(
  walletAddress: string,
): Promise<AuthorStorageUsageResponse> {
  const author = await getMyAuthorProfile(walletAddress);
  return toAuthorStorageUsageResponse(
    author,
    await getAuthorStorageUsageStats(author),
  );
}

export function listPlatformPlans(): PlatformPlanResponse[] {
  return [...platformPlans].sort(
    (left, right) => left.sortOrder - right.sortOrder,
  );
}

export async function getMyAuthorPlatformBilling(
  walletAddress: string,
): Promise<AuthorPlatformBillingResponse> {
  const author = await getMyAuthorProfile(walletAddress);
  return buildAuthorPlatformBilling(author);
}

export async function getPlatformTierManagerDeployment(
  chainId: number,
): Promise<ContractDeploymentDoc | null> {
  return repo.findContractDeployment(chainId, "PlatformTierManager");
}

export async function getPlatformStorageManagerDeployment(
  chainId: number,
): Promise<ContractDeploymentDoc | null> {
  return repo.findContractDeployment(chainId, "PlatformStorageManager");
}

export async function previewMyAuthorPlatformCleanup(
  walletAddress: string,
): Promise<AuthorPlatformCleanupPreviewResponse> {
  const author = await getMyAuthorProfile(walletAddress);
  return previewAuthorPlatformCleanup(author);
}

export async function runMyAuthorPlatformCleanup(
  walletAddress: string,
): Promise<AuthorPlatformCleanupRunResponse> {
  const author = await getMyAuthorProfile(walletAddress);
  return cleanupExpiredAuthorPlatformStorage(author);
}

export async function createPlatformTierPaymentIntent(
  walletAddress: string,
  input: CreatePlatformTierPaymentIntentRequest,
): Promise<PlatformTierPaymentIntentDoc> {
  const wallet = normalizeWallet(walletAddress);
  const author = await getMyAuthorProfile(wallet);
  const plan = getPlatformPlan(input.planCode);
  if (plan.code === PLATFORM_PLAN_CODE.FREE) {
    throw APIError.failedPrecondition(
      "free platform plan does not require payment",
    );
  }

  const chainId = normalizeChainId(input.chainId);
  const tokenAddress = resolvePlatformPaymentToken(chainId);
  const deployment = await repo.findContractDeployment(
    chainId,
    "PlatformTierManager",
  );
  if (!deployment) {
    throw APIError.failedPrecondition(
      "platform tier manager is not deployed for this network",
    );
  }

  const now = new Date();
  const tierKey = buildPlatformTierKey(plan.code);
  return repo.createPlatformTierPaymentIntent({
    authorId: author._id,
    walletAddress: wallet,
    planCode: plan.code,
    tierKey,
    chainId,
    tokenAddress,
    contractAddress: deployment.address,
    amount: calculatePlatformPlanAmount(plan),
    status: PAYMENT_INTENT_STATUS.PENDING,
    txHash: null,
    validUntil: null,
    expiresAt: addMinutes(now, 30),
    createdAt: now,
    updatedAt: now,
  });
}

export async function createPlatformStoragePaymentIntent(
  walletAddress: string,
  input: CreatePlatformStoragePaymentIntentRequest,
): Promise<PlatformStoragePaymentIntentDoc> {
  const wallet = normalizeWallet(walletAddress);
  const author = await getMyAuthorProfile(wallet);
  const plan = getPlatformPlan(PLATFORM_PLAN_CODE.BASIC);
  const extraStorageGb = normalizeExtraStorageGb(input.extraStorageGb, plan);
  if (extraStorageGb === 0) {
    throw APIError.invalidArgument("extraStorageGb must be greater than 0");
  }

  const chainId = normalizeChainId(input.chainId);
  const tokenAddress = resolvePlatformPaymentToken(chainId);
  const deployment = await repo.findContractDeployment(
    chainId,
    "PlatformStorageManager",
  );
  if (!deployment) {
    throw APIError.failedPrecondition(
      "platform storage manager is not deployed for this network",
    );
  }

  const now = new Date();
  return repo.createPlatformStoragePaymentIntent({
    authorId: author._id,
    walletAddress: wallet,
    extraStorageGb,
    chainId,
    tokenAddress,
    contractAddress: deployment.address,
    amount: calculatePlatformStorageAmount(plan, extraStorageGb),
    status: PAYMENT_INTENT_STATUS.PENDING,
    txHash: null,
    validUntil: null,
    expiresAt: addMinutes(now, 30),
    createdAt: now,
    updatedAt: now,
  });
}

export async function confirmPlatformTierPayment(
  walletAddress: string,
  intentId: string,
  input: ConfirmSubscriptionPaymentRequest,
): Promise<PlatformTierPaymentIntentDoc> {
  const wallet = normalizeWallet(walletAddress);
  const txHash = normalizeTxHash(input.txHash);
  const intent = await repo.findPlatformTierPaymentIntentByIdAndWallet(
    parseObjectId(intentId, "intentId"),
    wallet,
  );
  if (!intent) {
    throw APIError.notFound("platform tier payment intent not found");
  }
  if (intent.status === "cancelled") {
    throw APIError.failedPrecondition("platform tier payment intent is cancelled");
  }
  if (
    intent.status === PAYMENT_INTENT_STATUS.EXPIRED ||
    intent.expiresAt.getTime() < Date.now()
  ) {
    const expired = await repo.updatePlatformTierPaymentIntent(
      intent._id,
      {
        status: PAYMENT_INTENT_STATUS.EXPIRED,
        updatedAt: new Date(),
      },
    );
    if (!expired) {
      throw APIError.notFound("platform tier payment intent not found");
    }
    return expired;
  }
  if (intent.status === PAYMENT_INTENT_STATUS.CONFIRMED) {
    return intent;
  }

  const existingTx = await repo.findPlatformTierPaymentIntentByTxHash(txHash);
  if (existingTx && !existingTx._id.equals(intent._id)) {
    throw APIError.alreadyExists(
      "transaction hash is already attached to platform payment",
    );
  }

  const payment = await verifyPlatformTierPayment({
    authorWallet: wallet,
    chainId: intent.chainId,
    contractAddress: intent.contractAddress,
    tierKey: intent.tierKey,
    tokenAddress: intent.tokenAddress,
    amount: intent.amount,
    txHash,
  });
  const now = new Date();
  const plan = getPlatformPlan(intent.planCode);
  await repo.upsertAuthorPlatformSubscription(
    {
      authorId: intent.authorId,
      walletAddress: wallet,
      planCode: plan.code,
      status: PLATFORM_BILLING_STATUS.ACTIVE,
      baseStorageBytes: plan.baseStorageBytes,
      features: plan.features,
      validUntil: payment.paidUntil,
      graceUntil: new Date(
        payment.paidUntil.getTime() + PLATFORM_GRACE_PERIOD_MS,
      ),
      cleanupScheduledAt: null,
      lastCleanupAt: null,
      lastTxHash: txHash,
    },
    now,
  );

  const updated = await repo.updatePlatformTierPaymentIntent(
    intent._id,
    {
      status: PAYMENT_INTENT_STATUS.CONFIRMED,
      txHash,
      validUntil: payment.paidUntil,
      updatedAt: now,
    },
  );
  if (!updated) {
    throw APIError.notFound("platform tier payment intent not found");
  }

  return updated;
}

export async function confirmPlatformStoragePayment(
  walletAddress: string,
  intentId: string,
  input: ConfirmSubscriptionPaymentRequest,
): Promise<PlatformStoragePaymentIntentDoc> {
  const wallet = normalizeWallet(walletAddress);
  const txHash = normalizeTxHash(input.txHash);
  const intent = await repo.findPlatformStoragePaymentIntentByIdAndWallet(
    parseObjectId(intentId, "intentId"),
    wallet,
  );
  if (!intent) {
    throw APIError.notFound("platform storage payment intent not found");
  }
  if (intent.status === "cancelled") {
    throw APIError.failedPrecondition("platform storage payment intent is cancelled");
  }
  if (
    intent.status === PAYMENT_INTENT_STATUS.EXPIRED ||
    intent.expiresAt.getTime() < Date.now()
  ) {
    const expired = await repo.updatePlatformStoragePaymentIntent(intent._id, {
      status: PAYMENT_INTENT_STATUS.EXPIRED,
      updatedAt: new Date(),
    });
    if (!expired) {
      throw APIError.notFound("platform storage payment intent not found");
    }
    return expired;
  }
  if (intent.status === PAYMENT_INTENT_STATUS.CONFIRMED) {
    return intent;
  }

  const existingTx = await repo.findPlatformStoragePaymentIntentByTxHash(txHash);
  if (existingTx && !existingTx._id.equals(intent._id)) {
    throw APIError.alreadyExists(
      "transaction hash is already attached to platform payment",
    );
  }

  const payment = await verifyPlatformStoragePayment({
    authorWallet: wallet,
    chainId: intent.chainId,
    contractAddress: intent.contractAddress,
    extraStorageGb: intent.extraStorageGb,
    tokenAddress: intent.tokenAddress,
    amount: intent.amount,
    txHash,
  });
  const now = new Date();
  await repo.upsertAuthorPlatformStorageSubscription(
    {
      authorId: intent.authorId,
      walletAddress: wallet,
      status: PLATFORM_BILLING_STATUS.ACTIVE,
      extraStorageBytes: intent.extraStorageGb * GIB,
      validUntil: payment.paidUntil,
      graceUntil: new Date(
        payment.paidUntil.getTime() + PLATFORM_GRACE_PERIOD_MS,
      ),
      lastTxHash: txHash,
    },
    now,
  );

  const updated = await repo.updatePlatformStoragePaymentIntent(intent._id, {
    status: PAYMENT_INTENT_STATUS.CONFIRMED,
    txHash,
    validUntil: payment.paidUntil,
    updatedAt: now,
  });
  if (!updated) {
    throw APIError.notFound("platform storage payment intent not found");
  }

  return updated;
}

export async function buildAuthorPlatformBilling(
  author: AuthorProfileDoc,
): Promise<AuthorPlatformBillingResponse> {
  const [usage, subscription, storageSubscription] = await Promise.all([
    getAuthorStorageUsageStats(author),
    repo.findAuthorPlatformSubscriptionByAuthorId(author._id),
    repo.findAuthorPlatformStorageSubscriptionByAuthorId(author._id),
  ]);
  const state = resolvePlatformSubscriptionState(subscription, new Date());
  const storageState = resolvePlatformSubscriptionState(
    storageSubscription,
    new Date(),
  );
  const subscriptionPlan =
    subscription && state.status !== PLATFORM_BILLING_STATUS.EXPIRED
      ? getPlatformPlan(subscription.planCode)
      : null;
  const plan = subscriptionPlan ?? getPlatformPlan(PLATFORM_PLAN_CODE.FREE);
  const baseStorageBytes =
    subscriptionPlan && subscription
      ? subscription.baseStorageBytes
      : plan.baseStorageBytes;
  const extraStorageBytes =
    storageState.status === PLATFORM_BILLING_STATUS.ACTIVE &&
    storageSubscription
      ? storageSubscription.extraStorageBytes
      : 0;
  const totalStorageBytes = baseStorageBytes + extraStorageBytes;
  const usedStorageBytes = usage.postsBytes + usage.projectsBytes;
  const features =
    state.status === PLATFORM_BILLING_STATUS.ACTIVE
      ? (subscription?.features ?? plan.features)
      : plan.features;

  return {
    authorId: author._id.toHexString(),
    plan,
    planCode: plan.code,
    status: state.status,
    validUntil: subscription?.validUntil?.toISOString() ?? null,
    graceUntil: state.graceUntil?.toISOString() ?? null,
    cleanupScheduledAt: subscription?.cleanupScheduledAt?.toISOString() ?? null,
    lastCleanupAt: subscription?.lastCleanupAt?.toISOString() ?? null,
    baseStorageBytes,
    extraStorageBytes,
    totalStorageBytes,
    usedStorageBytes,
    remainingStorageBytes: Math.max(totalStorageBytes - usedStorageBytes, 0),
    postsBytes: usage.postsBytes,
    projectsBytes: usage.projectsBytes,
    features,
    isProjectCreationAllowed:
      state.status === PLATFORM_BILLING_STATUS.ACTIVE &&
      hasPlatformFeature(features, PLATFORM_FEATURE.PROJECTS),
    isUploadAllowed:
      state.status !== PLATFORM_BILLING_STATUS.GRACE &&
      usedStorageBytes < totalStorageBytes,
  };
}

async function getAuthorStorageUsageStats(
  author: AuthorProfileDoc,
): Promise<AuthorStorageUsageStats> {
  const [postsBytes, projectsBytes] = await Promise.all([
    repo.sumPostAttachmentBytesByAuthorId(author._id),
    repo.sumProjectFileBytesByAuthorId(author._id),
  ]);

  return { postsBytes, projectsBytes };
}

function resolvePlatformSubscriptionState(
  subscription: {
    status: Exclude<PlatformBillingStatus, "free">;
    validUntil: Date | null;
    graceUntil: Date | null;
  } | null,
  now: Date,
): {
  status: PlatformBillingStatus;
  graceUntil: Date | null;
} {
  if (!subscription) {
    return { status: PLATFORM_BILLING_STATUS.FREE, graceUntil: null };
  }

  if (
    subscription.status === PLATFORM_BILLING_STATUS.ACTIVE &&
    subscription.validUntil &&
    subscription.validUntil.getTime() > now.getTime()
  ) {
    return {
      status: PLATFORM_BILLING_STATUS.ACTIVE,
      graceUntil: subscription.graceUntil,
    };
  }

  const graceUntil =
    subscription.graceUntil ??
    (subscription.validUntil
      ? new Date(subscription.validUntil.getTime() + PLATFORM_GRACE_PERIOD_MS)
      : null);
  if (
    subscription.status !== PLATFORM_BILLING_STATUS.EXPIRED &&
    graceUntil &&
    graceUntil.getTime() > now.getTime()
  ) {
    return { status: PLATFORM_BILLING_STATUS.GRACE, graceUntil };
  }

  return { status: PLATFORM_BILLING_STATUS.EXPIRED, graceUntil };
}

export async function previewAuthorPlatformCleanup(
  author: AuthorProfileDoc,
): Promise<AuthorPlatformCleanupPreviewResponse> {
  const billing = await buildAuthorPlatformBilling(author);
  const freePlan = getPlatformPlan(PLATFORM_PLAN_CODE.FREE);
  const bytesToDelete = Math.max(
    billing.usedStorageBytes - freePlan.baseStorageBytes,
    0,
  );
  const candidates =
    bytesToDelete > 0
      ? selectCleanupCandidates(
          await listAuthorCleanupCandidates(author),
          bytesToDelete,
        )
      : [];

  return {
    authorId: author._id.toHexString(),
    status: billing.status,
    freeStorageBytes: freePlan.baseStorageBytes,
    usedStorageBytes: billing.usedStorageBytes,
    bytesToDelete,
    willDeleteBytes: candidates.reduce((sum, item) => sum + item.size, 0),
    candidates,
  };
}

async function listAuthorCleanupCandidates(
  author: AuthorProfileDoc,
): Promise<AuthorPlatformCleanupItemResponse[]> {
  const [attachments, projectFiles] = await Promise.all([
    repo.listPostAttachmentsByAuthorId(author._id),
    repo.listProjectFileNodesByAuthorId(author._id),
  ]);

  return [
    ...attachments.map((attachment) => ({
      id: attachment._id.toHexString(),
      kind: CLEANUP_ITEM_KIND.POST_ATTACHMENT,
      parentId: attachment.postId.toHexString(),
      fileName: attachment.fileName,
      storageKey: attachment.storageKey,
      size: attachment.size,
      createdAt: attachment.createdAt.toISOString(),
    })),
    ...projectFiles.map((node) => ({
      id: node._id.toHexString(),
      kind: CLEANUP_ITEM_KIND.PROJECT_FILE,
      parentId: node.projectId.toHexString(),
      fileName: node.name,
      storageKey: node.storageKey ?? "",
      size: node.size ?? 0,
      createdAt: node.createdAt.toISOString(),
    })),
  ].sort(
    (left, right) =>
      new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
  );
}

export function selectCleanupCandidates(
  candidates: AuthorPlatformCleanupItemResponse[],
  bytesToDelete: number,
): AuthorPlatformCleanupItemResponse[] {
  const selected: AuthorPlatformCleanupItemResponse[] = [];
  let selectedBytes = 0;

  for (const candidate of candidates) {
    if (selectedBytes >= bytesToDelete) {
      break;
    }

    selected.push(candidate);
    selectedBytes += candidate.size;
  }

  return selected;
}

export async function cleanupExpiredAuthorPlatformStorage(
  author: AuthorProfileDoc,
): Promise<AuthorPlatformCleanupRunResponse> {
  const previewBefore = await previewAuthorPlatformCleanup(author);
  const now = new Date();
  const deletedItems: AuthorPlatformCleanupItemResponse[] = [];

  if (
    previewBefore.status !== PLATFORM_BILLING_STATUS.EXPIRED ||
    previewBefore.bytesToDelete <= 0
  ) {
    const previewAfter = await previewAuthorPlatformCleanup(author);
    const log = await repo.createAuthorPlatformCleanupLog({
      authorId: author._id,
      status: CLEANUP_RUN_STATUS.SKIPPED,
      deletedBytes: 0,
      deletedItems,
      previewBefore,
      previewAfter,
      createdAt: now,
    });

    return {
      id: log._id.toHexString(),
      authorId: author._id.toHexString(),
      status: CLEANUP_RUN_STATUS.SKIPPED,
      deletedBytes: 0,
      deletedItems,
      previewAfter,
      createdAt: log.createdAt.toISOString(),
    };
  }

  for (const candidate of previewBefore.candidates) {
    if (candidate.kind === CLEANUP_ITEM_KIND.POST_ATTACHMENT) {
      const attachment = await repo.findPostAttachmentByIdAndPostId(
        new ObjectId(candidate.id),
        new ObjectId(candidate.parentId),
      );
      if (attachment) {
        await deleteObject(attachment.storageKey);
        await repo.deletePostAttachmentById(attachment);
        deletedItems.push(candidate);
      }
      continue;
    }

    const node = await repo.findProjectNodeByIdAndProjectId(
      new ObjectId(candidate.id),
      new ObjectId(candidate.parentId),
    );
    if (node?.storageKey) {
      await deleteObject(node.storageKey);
      await repo.deleteProjectNodes([node._id]);
      deletedItems.push(candidate);
    }
  }

  const previewAfter = await previewAuthorPlatformCleanup(author);
  const deletedBytes = deletedItems.reduce(
    (total, item) => total + item.size,
    0,
  );
  await repo.updateAuthorPlatformSubscriptionByAuthorId(author._id, {
    cleanupScheduledAt: null,
    lastCleanupAt: now,
    updatedAt: now,
  });
  const log = await repo.createAuthorPlatformCleanupLog({
    authorId: author._id,
    status: CLEANUP_RUN_STATUS.COMPLETED,
    deletedBytes,
    deletedItems,
    previewBefore,
    previewAfter,
    createdAt: now,
  });

  return {
    id: log._id.toHexString(),
    authorId: author._id.toHexString(),
    status: CLEANUP_RUN_STATUS.COMPLETED,
    deletedBytes,
    deletedItems,
    previewAfter,
    createdAt: log.createdAt.toISOString(),
  };
}

function getPlatformPlan(code: PlatformPlanDoc["code"]): PlatformPlanDoc {
  const plan = platformPlans.find((item) => item.code === code && item.active);
  if (!plan) {
    throw APIError.failedPrecondition("platform plan required");
  }

  return plan;
}

function buildPlatformTierKey(code: PlatformPlanDoc["code"]): string {
  return hashId(`platform:${code}`).toLowerCase();
}

function calculatePlatformPlanAmount(
  plan: PlatformPlanDoc,
): string {
  return String(BigInt(plan.priceUsdCents) * 10_000n);
}

function calculatePlatformStorageAmount(
  plan: PlatformPlanDoc,
  extraStorageGb: number,
): string {
  return String(
    BigInt(extraStorageGb) * BigInt(plan.pricePerExtraGbUsdCents) * 10_000n,
  );
}

function resolvePlatformPaymentToken(chainId: number): string {
  const token = getPlatformUsdcToken(chainId);
  if (!token) {
    throw APIError.failedPrecondition(
      `USDC is not configured for platform billing on chain ${chainId}`,
    );
  }

  return normalizePlanTokenAddress(PAYMENT_ASSET.ERC20, token.address);
}

function normalizeExtraStorageGb(value: number, plan: PlatformPlanDoc): number {
  const maxExtraGb = Math.floor(plan.maxExtraStorageBytes / GIB);
  if (!Number.isInteger(value) || value < 0 || value > maxExtraGb) {
    throw APIError.invalidArgument(
      `extraStorageGb must be an integer between 0 and ${maxExtraGb}`,
    );
  }

  return value;
}

function hasPlatformFeature(
  features: PlatformFeature[],
  feature: PlatformFeature,
): boolean {
  return features.includes(feature);
}

export async function assertAuthorPlatformFeature(
  author: AuthorProfileDoc,
  feature: PlatformFeature,
): Promise<void> {
  const billing = await buildAuthorPlatformBilling(author);
  if (!hasPlatformFeature(billing.features, feature)) {
    throw APIError.failedPrecondition("feature not available on current plan");
  }
}

export async function assertAuthorStorageQuota(
  author: AuthorProfileDoc,
  incomingBytes: number,
): Promise<void> {
  const billing = await buildAuthorPlatformBilling(author);
  if (
    !billing.isUploadAllowed ||
    billing.usedStorageBytes + incomingBytes > billing.totalStorageBytes
  ) {
    throw APIError.failedPrecondition("storage quota exceeded");
  }
}
