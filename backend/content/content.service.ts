import { APIError } from "encore.dev/api";
import { id as hashId } from "ethers";
import { ObjectId } from "mongodb";
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
  createPostAttachmentObjectKey,
  createProjectObjectKey,
  deleteObject,
  getObject,
  putObject,
} from "../storage/object-storage";
import {
  readOnChainAccessGrants,
  verifyPlanRegistration,
  verifySubscriptionPayment,
} from "./onchain";
import * as repo from "./repository";
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
  ConfirmSubscriptionPaymentRequest,
  AuthorStorageUsageResponse,
  AuthorStorageUsageStats,
  ContractDeploymentDoc,
  ContractDeploymentResponse,
  CreateAccessPolicyPresetRequest,
  CreateAuthorProfileRequest,
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
} from "./types";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const GIB = 1024 * 1024 * 1024;
const PLATFORM_GRACE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000;

const platformPlans: PlatformPlanDoc[] = [
  {
    code: "free",
    title: "Free",
    description: "Start publishing posts with a small storage quota.",
    priceUsdCents: 0,
    billingPeriodDays: 30,
    baseStorageBytes: GIB,
    maxExtraStorageBytes: 0,
    pricePerExtraGbUsdCents: 0,
    features: ["posts"],
    active: true,
    sortOrder: 1,
  },
  {
    code: "basic",
    title: "Basic",
    description: "Unlock projects and future homepage promotion tools.",
    priceUsdCents: 500,
    billingPeriodDays: 30,
    baseStorageBytes: 3 * GIB,
    maxExtraStorageBytes: 10 * GIB,
    pricePerExtraGbUsdCents: 100,
    features: ["posts", "projects", "homepage_promo"],
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
    displayName: shortenWallet(normalizedWallet),
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

export async function previewMyAuthorPlatformCleanup(
  walletAddress: string,
): Promise<AuthorPlatformCleanupPreviewResponse> {
  const author = await getMyAuthorProfile(walletAddress);
  return previewAuthorPlatformCleanup(author);
}

export async function buildAuthorPlatformBilling(
  author: AuthorProfileDoc,
): Promise<AuthorPlatformBillingResponse> {
  const [usage, subscription] = await Promise.all([
    getAuthorStorageUsageStats(author),
    repo.findAuthorPlatformSubscriptionByAuthorId(author._id),
  ]);
  const state = resolvePlatformSubscriptionState(subscription, new Date());
  const subscriptionPlan =
    subscription && state.status !== "expired"
      ? getPlatformPlan(subscription.planCode)
      : null;
  const plan = subscriptionPlan ?? getPlatformPlan("free");
  const baseStorageBytes =
    subscriptionPlan && subscription
      ? subscription.baseStorageBytes
      : plan.baseStorageBytes;
  const extraStorageBytes =
    subscriptionPlan && subscription ? subscription.extraStorageBytes : 0;
  const totalStorageBytes =
    subscriptionPlan && subscription
      ? subscription.totalStorageBytes
      : baseStorageBytes + extraStorageBytes;
  const usedStorageBytes = usage.postsBytes + usage.projectsBytes;
  const features =
    state.status === "active"
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
      state.status === "active" && hasPlatformFeature(features, "projects"),
    isUploadAllowed:
      state.status !== "grace" && usedStorageBytes < totalStorageBytes,
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
  subscription: Awaited<
    ReturnType<typeof repo.findAuthorPlatformSubscriptionByAuthorId>
  > | null,
  now: Date,
): {
  status: "free" | "active" | "grace" | "expired";
  graceUntil: Date | null;
} {
  if (!subscription) {
    return { status: "free", graceUntil: null };
  }

  if (
    subscription.status === "active" &&
    subscription.validUntil &&
    subscription.validUntil.getTime() > now.getTime()
  ) {
    return { status: "active", graceUntil: subscription.graceUntil };
  }

  const graceUntil =
    subscription.graceUntil ??
    (subscription.validUntil
      ? new Date(subscription.validUntil.getTime() + PLATFORM_GRACE_PERIOD_MS)
      : null);
  if (
    subscription.status !== "expired" &&
    graceUntil &&
    graceUntil.getTime() > now.getTime()
  ) {
    return { status: "grace", graceUntil };
  }

  return { status: "expired", graceUntil };
}

export async function previewAuthorPlatformCleanup(
  author: AuthorProfileDoc,
): Promise<AuthorPlatformCleanupPreviewResponse> {
  const billing = await buildAuthorPlatformBilling(author);
  const freePlan = getPlatformPlan("free");
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
      kind: "post_attachment" as const,
      parentId: attachment.postId.toHexString(),
      fileName: attachment.fileName,
      storageKey: attachment.storageKey,
      size: attachment.size,
      createdAt: attachment.createdAt.toISOString(),
    })),
    ...projectFiles.map((node) => ({
      id: node._id.toHexString(),
      kind: "project_file" as const,
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
): Promise<AuthorPlatformCleanupPreviewResponse> {
  const preview = await previewAuthorPlatformCleanup(author);
  if (preview.status !== "expired" || preview.bytesToDelete <= 0) {
    return preview;
  }

  for (const candidate of preview.candidates) {
    if (candidate.kind === "post_attachment") {
      const attachment = await repo.findPostAttachmentByIdAndPostId(
        new ObjectId(candidate.id),
        new ObjectId(candidate.parentId),
      );
      if (attachment) {
        await deleteObject(attachment.storageKey);
        await repo.deletePostAttachmentById(attachment);
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
    }
  }

  return previewAuthorPlatformCleanup(author);
}

function getPlatformPlan(code: PlatformPlanDoc["code"]): PlatformPlanDoc {
  const plan = platformPlans.find((item) => item.code === code && item.active);
  if (!plan) {
    throw APIError.failedPrecondition("platform plan required");
  }

  return plan;
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

export async function getMyAuthorProfile(
  walletAddress: string,
): Promise<AuthorProfileDoc> {
  const user = await getOrCreateUserByWallet(walletAddress);
  const author = await repo.findAuthorProfileByUserId(user._id.toHexString());
  if (!author) {
    throw APIError.notFound("author profile not found");
  }
  return author;
}

export async function updateMyAuthorProfile(
  walletAddress: string,
  update: UpdateAuthorProfileRequest,
): Promise<AuthorProfileDoc> {
  const author = await getMyAuthorProfile(walletAddress);

  const nextDisplayName =
    update.displayName === undefined
      ? author.displayName
      : normalizeDisplayName(update.displayName);
  const nextBio =
    update.bio === undefined ? author.bio : normalizeBio(update.bio);
  const nextTags =
    update.tags === undefined
      ? (author.tags ?? [])
      : normalizeAuthorTags(update.tags);
  const nextDefaultPolicy =
    update.defaultPolicyId !== undefined
      ? await resolveDefaultPolicyFromPreset(author, update.defaultPolicyId)
      : update.defaultPolicy === undefined &&
          update.defaultPolicyInput === undefined
        ? author.defaultPolicy
        : await normalizeRequestedAuthorDefaultPolicy(
            author,
            update.defaultPolicy,
            update.defaultPolicyInput,
          );

  const updated = await repo.updateAuthorProfile(author._id, {
    displayName: nextDisplayName,
    bio: nextBio,
    tags: nextTags,
    defaultPolicy: nextDefaultPolicy,
    defaultPolicyId:
      update.defaultPolicyId === undefined
        ? author.defaultPolicyId
        : update.defaultPolicyId
          ? parseObjectId(update.defaultPolicyId, "defaultPolicyId")
          : null,
    updatedAt: new Date(),
  });

  if (!updated) {
    throw APIError.notFound("author profile not found");
  }

  return updated;
}

export async function deleteMyAuthorProfile(
  walletAddress: string,
): Promise<void> {
  const user = await getOrCreateUserByWallet(walletAddress);
  const author = await repo.findAuthorProfileByUserId(user._id.toHexString());
  if (!author) {
    throw APIError.notFound("author profile not found");
  }

  await repo.deleteSubscriptionPaymentIntentsByAuthorId(author._id);
  await repo.deleteSubscriptionEntitlementsByAuthorId(author._id);
  await repo.deleteSubscriptionPlansByAuthorId(author._id);
  await repo.deleteProjectNodesByAuthorId(author._id);
  await repo.deleteProjectsByAuthorId(author._id);
  await repo.deletePostsByAuthorId(author._id);
  await repo.deleteAccessPolicyPresetsByAuthorId(author._id);

  const deleted = await repo.deleteAuthorProfileByIdAndUserId(
    author._id,
    user._id.toHexString(),
  );
  if (!deleted) {
    throw APIError.notFound("author profile not found");
  }
}

export async function listMyAccessPolicyPresets(
  walletAddress: string,
): Promise<AccessPolicyPresetDoc[]> {
  const author = await getMyAuthorProfile(walletAddress);
  return repo.listAccessPolicyPresetsByAuthorId(author._id);
}

export async function listMyAccessPolicyPresetResponses(
  walletAddress: string,
): Promise<AccessPolicyPresetResponse[]> {
  const author = await getMyAuthorProfile(walletAddress);
  const policies = await repo.listAccessPolicyPresetsByAuthorId(author._id);
  return Promise.all(
    policies.map((policy) => toAccessPolicyPresetResponseWithUsage(policy)),
  );
}

export async function createMyAccessPolicyPreset(
  walletAddress: string,
  input: CreateAccessPolicyPresetRequest,
): Promise<AccessPolicyPresetDoc> {
  const author = await getMyAuthorProfile(walletAddress);
  const now = new Date();
  const isDefault = input.isDefault ?? false;
  const policy = await normalizePresetPolicy(
    author,
    input.policy,
    input.policyInput,
  );

  if (isDefault) {
    await repo.clearDefaultAccessPolicyPreset(author._id);
  }

  const preset = await repo.createAccessPolicyPreset({
    authorId: author._id,
    name: normalizePresetName(input.name),
    description: normalizePresetDescription(input.description ?? ""),
    policy,
    isDefault,
    createdAt: now,
    updatedAt: now,
  });

  if (isDefault) {
    await repo.updateAuthorProfile(author._id, {
      defaultPolicy: preset.policy,
      defaultPolicyId: preset._id,
      updatedAt: now,
    });
  }

  return preset;
}

export async function updateMyAccessPolicyPreset(
  walletAddress: string,
  presetId: string,
  input: UpdateAccessPolicyPresetRequest,
): Promise<AccessPolicyPresetDoc> {
  const author = await getMyAuthorProfile(walletAddress);
  const objectId = parseObjectId(presetId, "presetId");
  const existing = await repo.findAccessPolicyPresetByIdAndAuthorId(
    objectId,
    author._id,
  );
  if (!existing) {
    throw APIError.notFound("access policy preset not found");
  }

  const isDefault = input.isDefault ?? existing.isDefault;
  const policy =
    input.policy === undefined && input.policyInput === undefined
      ? existing.policy
      : await normalizePresetPolicy(author, input.policy, input.policyInput);

  if (isDefault) {
    await repo.clearDefaultAccessPolicyPreset(author._id);
  }

  const updated = await repo.updateAccessPolicyPreset(objectId, author._id, {
    name:
      input.name === undefined
        ? existing.name
        : normalizePresetName(input.name),
    description:
      input.description === undefined
        ? existing.description
        : normalizePresetDescription(input.description),
    policy,
    isDefault,
    updatedAt: new Date(),
  });

  if (!updated) {
    throw APIError.notFound("access policy preset not found");
  }

  if (updated.isDefault) {
    await repo.updateAuthorProfile(author._id, {
      defaultPolicy: updated.policy,
      defaultPolicyId: updated._id,
      updatedAt: updated.updatedAt,
    });
  }

  return updated;
}

export async function deleteMyAccessPolicyPreset(
  walletAddress: string,
  presetId: string,
): Promise<void> {
  const author = await getMyAuthorProfile(walletAddress);
  const objectId = parseObjectId(presetId, "presetId");
  const preset = await repo.findAccessPolicyPresetByIdAndAuthorId(
    objectId,
    author._id,
  );
  if (!preset) {
    throw APIError.notFound("access policy preset not found");
  }
  if (preset.isDefault || author.defaultPolicyId?.equals(preset._id)) {
    throw APIError.failedPrecondition(
      "default access policy cannot be deleted",
    );
  }

  const [postCount, projectCount] = await Promise.all([
    repo.countPostsByAccessPolicyId(author._id, objectId),
    repo.countProjectsByAccessPolicyId(author._id, objectId),
  ]);
  if (postCount + projectCount > 0) {
    throw APIError.failedPrecondition("access policy is used by content");
  }

  const deleted = await repo.deleteAccessPolicyPreset(objectId, author._id);
  if (!deleted) {
    throw APIError.notFound("access policy preset not found");
  }
}

export async function listAuthorAccessPoliciesBySlug(
  slug: string,
  viewerWallet?: string,
): Promise<AuthorAccessPolicyResponse[]> {
  const author = await getAuthorProfileBySlug(slug);
  const [policies, plans] = await Promise.all([
    repo.listAccessPolicyPresetsByAuthorId(author._id),
    repo.listSubscriptionPlansByAuthorId(author._id),
  ]);
  const plansById = new Map(
    plans.map((plan) => [plan._id.toHexString(), plan]),
  );

  return Promise.all(
    policies
      .filter((policy) => policy.policy.root.type !== "public")
      .map(async (policy) => {
        const context = await buildAccessEvaluationContext(
          author._id,
          policy.policy,
          viewerWallet,
        );
        const evaluation = evaluateAccessPolicy(policy.policy, context);
        const conditions = await buildAccessPolicyConditionResponses(
          policy.policy.root,
          context,
          plansById,
        );
        const planIds = collectSubscriptionPlanIds(policy.policy.root).map(
          (id) => new ObjectId(id),
        );
        const paidSubscribersCount = planIds.length
          ? await repo.countActiveSubscriptionEntitlementsByPlanIds(
              planIds,
              new Date(),
            )
          : 0;

        return {
          ...toAccessPolicyPresetResponse(policy),
          accessLabel: describeAccessPolicy(policy.policy.root, plans),
          hasAccess: evaluation.allowed,
          paidSubscribersCount,
          conditionMode: getConditionMode(policy.policy.root),
          conditions,
        };
      }),
  );
}

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

export async function getMySubscriptionPlan(
  walletAddress: string,
): Promise<SubscriptionPlanDoc> {
  const author = await getMyAuthorProfile(walletAddress);
  const plan = await getAuthorMainSubscriptionPlan(author);
  if (!plan) {
    throw APIError.notFound("subscription plan not found");
  }
  return plan;
}

export async function listMySubscriptionPlans(
  walletAddress: string,
): Promise<SubscriptionPlanDoc[]> {
  const author = await getMyAuthorProfile(walletAddress);
  return repo.listSubscriptionPlansByAuthorId(author._id);
}

export async function getAuthorSubscriptionPlanBySlug(
  slug: string,
): Promise<SubscriptionPlanDoc> {
  const author = await getAuthorProfileBySlug(slug);
  const plan = await getAuthorMainSubscriptionPlan(author);
  if (!plan || !plan.active) {
    throw APIError.notFound("subscription plan not found");
  }
  return plan;
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

export async function createMyPost(
  walletAddress: string,
  input: CreatePostRequest,
): Promise<PostDoc> {
  const author = await getMyAuthorProfile(walletAddress);
  const now = new Date();
  const title = normalizePostTitle(input.title);
  const content = normalizePostContent(input.content);
  const status = input.status ?? "draft";
  const policyMode = input.policyMode ?? "inherited";
  const policySelection = await normalizeContentPolicy(
    author,
    input,
    policyMode,
  );
  const attachmentIds = normalizeAttachmentIds(input.attachmentIds ?? []);
  const linkedProjectIds = await normalizeLinkedProjectIds(
    author,
    input.linkedProjectIds ?? [],
  );

  resolveEntityPolicy(policyMode, author.defaultPolicy, policySelection.policy);

  return repo.createPost({
    authorId: author._id,
    title,
    content,
    status,
    policyMode,
    policy: policySelection.policy,
    accessPolicyId: policySelection.accessPolicyId,
    attachmentIds,
    linkedProjectIds,
    publishedAt: status === "published" ? now : null,
    createdAt: now,
    updatedAt: now,
  });
}

export async function listMyPosts(walletAddress: string): Promise<PostDoc[]> {
  const author = await getMyAuthorProfile(walletAddress);
  return repo.listPostsByAuthorId(author._id);
}

export async function listMyArchivedPosts(
  walletAddress: string,
): Promise<PostDoc[]> {
  const author = await getMyAuthorProfile(walletAddress);
  return repo.listPostsByAuthorId(author._id, "archived");
}

export async function updateMyPost(
  walletAddress: string,
  postId: string,
  input: UpdatePostRequest,
): Promise<PostDoc> {
  const author = await getMyAuthorProfile(walletAddress);
  const objectId = parseObjectId(postId, "postId");
  const existing = await repo.findPostByIdAndAuthorId(objectId, author._id);
  if (!existing) {
    throw APIError.notFound("post not found");
  }

  const nextStatus = input.status ?? existing.status;
  const nextPolicyMode = input.policyMode ?? existing.policyMode;
  const nextPolicySelection =
    input.policyMode === undefined &&
    input.policy === undefined &&
    input.policyInput === undefined &&
    input.accessPolicyId === undefined
      ? { policy: existing.policy, accessPolicyId: existing.accessPolicyId }
      : await normalizeContentPolicy(author, input, nextPolicyMode);

  resolveEntityPolicy(
    nextPolicyMode,
    author.defaultPolicy,
    nextPolicySelection.policy,
  );

  const updated = await repo.updatePost(objectId, author._id, {
    title:
      input.title === undefined
        ? existing.title
        : normalizePostTitle(input.title),
    content:
      input.content === undefined
        ? existing.content
        : normalizePostContent(input.content),
    status: nextStatus,
    policyMode: nextPolicyMode,
    policy: nextPolicySelection.policy,
    accessPolicyId: nextPolicySelection.accessPolicyId,
    attachmentIds:
      input.attachmentIds === undefined
        ? existing.attachmentIds
        : normalizeAttachmentIds(input.attachmentIds),
    linkedProjectIds:
      input.linkedProjectIds === undefined
        ? (existing.linkedProjectIds ?? [])
        : await normalizeLinkedProjectIds(author, input.linkedProjectIds),
    publishedAt: resolvePublishedAt(
      existing.publishedAt,
      existing.status,
      nextStatus,
    ),
    updatedAt: new Date(),
  });

  if (!updated) {
    throw APIError.notFound("post not found");
  }

  return updated;
}

export async function deleteMyPost(
  walletAddress: string,
  postId: string,
): Promise<void> {
  const author = await getMyAuthorProfile(walletAddress);
  const objectId = parseObjectId(postId, "postId");
  const deleted = await repo.deletePost(objectId, author._id);
  if (!deleted) {
    throw APIError.notFound("post not found");
  }
  const attachments = await repo.deletePostAttachmentsByPostId(objectId);
  for (const attachment of attachments) {
    await deleteObject(attachment.storageKey);
  }
  await repo.deletePostCommentsByPostId(objectId);
}

export async function uploadMyPostAttachment(
  walletAddress: string,
  postId: string,
  input: {
    name: string;
    body: Buffer;
    contentType: string;
  },
): Promise<PostAttachmentDoc> {
  const author = await getMyAuthorProfile(walletAddress);
  const post = await repo.findPostByIdAndAuthorId(
    parseObjectId(postId, "postId"),
    author._id,
  );
  if (!post) {
    throw APIError.notFound("post not found");
  }
  await assertAuthorStorageQuota(author, input.body.length);

  const now = new Date();
  const attachmentId = new ObjectId();
  const fileName = normalizeProjectNodeName(input.name);
  const mimeType = input.contentType || "application/octet-stream";
  const storageKey = createPostAttachmentObjectKey({
    authorId: author._id.toHexString(),
    postId: post._id.toHexString(),
    attachmentId: attachmentId.toHexString(),
    fileName,
  });

  await putObject(storageKey, input.body, mimeType);

  const attachment = await repo.createPostAttachment({
    _id: attachmentId,
    postId: post._id,
    authorId: author._id,
    kind: resolvePostAttachmentKind(mimeType),
    fileName,
    storageKey,
    mimeType,
    size: input.body.length,
    createdAt: now,
  });

  await repo.appendPostAttachmentId(post._id, author._id, attachment._id, now);

  return attachment;
}

export async function getMyPostAttachment(
  walletAddress: string,
  postId: string,
  attachmentId: string,
): Promise<{ body: Buffer; contentType: string; fileName: string }> {
  const author = await getMyAuthorProfile(walletAddress);
  const post = await repo.findPostByIdAndAuthorId(
    parseObjectId(postId, "postId"),
    author._id,
  );
  if (!post) {
    throw APIError.notFound("post not found");
  }

  const attachment = await resolvePostAttachment(post, attachmentId);
  return readPostAttachmentObject(attachment);
}

export async function listPostCommentsBySlug(
  slug: string,
  postId: string,
  viewerWallet?: string,
): Promise<PostCommentDoc[]> {
  const { post } = await getReadablePostContext(slug, postId, viewerWallet);
  return repo.listPostComments(post._id);
}

export async function createPostCommentBySlug(
  slug: string,
  postId: string,
  walletAddress: string,
  input: CreatePostCommentRequest,
): Promise<PostCommentDoc> {
  const viewerWallet = normalizeWallet(walletAddress);
  const { post } = await getReadablePostContext(slug, postId, viewerWallet);
  const user = await getOrCreateUserByWallet(viewerWallet);
  const now = new Date();

  return repo.createPostComment({
    _id: new ObjectId(),
    postId: post._id,
    authorId: post.authorId,
    walletAddress: viewerWallet,
    displayName: user.displayName,
    content: normalizePostCommentContent(input.content),
    createdAt: now,
    updatedAt: now,
  });
}

export async function togglePostLikeBySlug(
  slug: string,
  postId: string,
  walletAddress: string,
): Promise<{ liked: boolean; likesCount: number }> {
  const viewerWallet = normalizeWallet(walletAddress);
  const { post } = await getReadablePostContext(slug, postId, viewerWallet);
  const existing = await repo.findPostLike(post._id, viewerWallet);

  if (existing) {
    await repo.deletePostLike(post._id, viewerWallet);
    return {
      liked: false,
      likesCount: await repo.countPostLikes(post._id),
    };
  }

  await repo.createPostLike({
    _id: new ObjectId(),
    postId: post._id,
    authorId: post.authorId,
    walletAddress: viewerWallet,
    createdAt: new Date(),
  });

  return {
    liked: true,
    likesCount: await repo.countPostLikes(post._id),
  };
}

export async function recordPostViewBySlug(
  slug: string,
  postId: string,
  viewerKey: string,
  viewerWallet?: string,
): Promise<{ viewsCount: number }> {
  const { post } = await getReadablePostContext(slug, postId, viewerWallet);
  const normalizedViewerKey = viewerKey.trim().slice(0, 160);
  if (!normalizedViewerKey) {
    throw APIError.invalidArgument("viewerKey is required");
  }

  return {
    viewsCount: await repo.recordPostView(post._id, normalizedViewerKey),
  };
}

export async function listAuthorPostsBySlug(
  slug: string,
  viewerWallet?: string,
): Promise<FeedPostResponse[]> {
  const author = await getAuthorProfileBySlug(slug);
  const posts = await repo.listPublishedPostsByAuthorId(author._id);
  return Promise.all(
    posts.map((post) =>
      buildFeedPostResponse(
        post,
        author,
        viewerWallet ? normalizeWallet(viewerWallet) : undefined,
      ),
    ),
  );
}

export async function getAuthorPostBySlugAndId(
  slug: string,
  postId: string,
  viewerWallet?: string,
): Promise<PostDoc> {
  const author = await getAuthorProfileBySlug(slug);
  const objectId = parseObjectId(postId, "postId");
  const post = await repo.findPublishedPostByIdAndAuthorId(
    objectId,
    author._id,
  );
  if (!post) {
    throw APIError.notFound("post not found");
  }

  const resolvedPolicy = resolveEntityPolicy(
    post.policyMode,
    author.defaultPolicy,
    post.policy,
  );

  const evaluation = evaluateAccessPolicy(
    resolvedPolicy,
    await buildAccessEvaluationContext(
      author._id,
      resolvedPolicy,
      viewerWallet,
    ),
  );

  if (!evaluation.allowed) {
    throw APIError.permissionDenied("access to this post is restricted");
  }

  return post;
}

export async function getAuthorPostAttachmentBySlug(
  slug: string,
  postId: string,
  attachmentId: string,
  viewerWallet?: string,
): Promise<{ body: Buffer; contentType: string; fileName: string }> {
  const { post } = await getReadablePostContext(slug, postId, viewerWallet);
  const attachment = await resolvePostAttachment(post, attachmentId);
  return readPostAttachmentObject(attachment);
}

export async function createMyProject(
  walletAddress: string,
  input: CreateProjectRequest,
): Promise<ProjectDoc> {
  const author = await getMyAuthorProfile(walletAddress);
  await assertAuthorPlatformFeature(author, "projects");
  const now = new Date();
  const projectId = new ObjectId();
  const rootNodeId = new ObjectId();
  const title = normalizeProjectTitle(input.title);
  const description = normalizeProjectDescription(input.description ?? "");
  const status = input.status ?? "draft";
  const policyMode = input.policyMode ?? "inherited";
  const policySelection = await normalizeContentPolicy(
    author,
    input,
    policyMode,
  );

  resolveEntityPolicy(policyMode, author.defaultPolicy, policySelection.policy);

  const rootNode = await repo.createProjectNode({
    _id: rootNodeId,
    authorId: author._id,
    projectId,
    parentId: null,
    kind: "folder",
    name: title,
    storageKey: null,
    mimeType: null,
    size: null,
    visibility: "published",
    createdAt: now,
    updatedAt: now,
  });

  const project = await repo.createProject({
    _id: projectId,
    authorId: author._id,
    title,
    description,
    status,
    policyMode,
    policy: policySelection.policy,
    accessPolicyId: policySelection.accessPolicyId,
    rootNodeId,
    publishedAt: status === "published" ? now : null,
    createdAt: now,
    updatedAt: now,
  });

  if (!project.rootNodeId.equals(rootNode._id)) {
    throw APIError.internal("project root node mismatch");
  }

  return project;
}

export async function listMyProjects(
  walletAddress: string,
): Promise<ProjectDoc[]> {
  const author = await getMyAuthorProfile(walletAddress);
  return repo.listProjectsByAuthorId(author._id);
}

export async function listMyArchivedProjects(
  walletAddress: string,
): Promise<ProjectDoc[]> {
  const author = await getMyAuthorProfile(walletAddress);
  return repo.listProjectsByAuthorId(author._id, "archived");
}

export async function updateMyProject(
  walletAddress: string,
  projectId: string,
  input: UpdateProjectRequest,
): Promise<ProjectDoc> {
  const author = await getMyAuthorProfile(walletAddress);
  const objectId = parseObjectId(projectId, "projectId");
  const existing = await repo.findProjectByIdAndAuthorId(objectId, author._id);
  if (!existing) {
    throw APIError.notFound("project not found");
  }

  const nextStatus = input.status ?? existing.status;
  const nextPolicyMode = input.policyMode ?? existing.policyMode;
  const nextPolicySelection =
    input.policyMode === undefined &&
    input.policy === undefined &&
    input.policyInput === undefined &&
    input.accessPolicyId === undefined
      ? { policy: existing.policy, accessPolicyId: existing.accessPolicyId }
      : await normalizeContentPolicy(author, input, nextPolicyMode);

  resolveEntityPolicy(
    nextPolicyMode,
    author.defaultPolicy,
    nextPolicySelection.policy,
  );

  const updated = await repo.updateProject(objectId, author._id, {
    title:
      input.title === undefined
        ? existing.title
        : normalizeProjectTitle(input.title),
    description:
      input.description === undefined
        ? existing.description
        : normalizeProjectDescription(input.description),
    status: nextStatus,
    policyMode: nextPolicyMode,
    policy: nextPolicySelection.policy,
    accessPolicyId: nextPolicySelection.accessPolicyId,
    publishedAt: resolvePublishedAt(
      existing.publishedAt,
      existing.status,
      nextStatus,
    ),
    updatedAt: new Date(),
  });

  if (!updated) {
    throw APIError.notFound("project not found");
  }

  if (input.title !== undefined) {
    await repo.updateProjectNode(existing.rootNodeId, existing._id, {
      name: updated.title,
      updatedAt: new Date(),
    });
  }

  return updated;
}

export async function deleteMyProject(
  walletAddress: string,
  projectId: string,
): Promise<void> {
  const author = await getMyAuthorProfile(walletAddress);
  const objectId = parseObjectId(projectId, "projectId");
  const project = await repo.findProjectByIdAndAuthorId(objectId, author._id);
  if (!project) {
    throw APIError.notFound("project not found");
  }

  const nodes = await repo.listProjectNodesByProjectId(project._id);
  for (const node of nodes) {
    if (node.kind === "file" && node.storageKey) {
      await deleteObject(node.storageKey);
    }
  }

  await repo.deleteProjectNodesByProjectId(project._id);
  const deleted = await repo.deleteProject(objectId, author._id);
  if (!deleted) {
    throw APIError.notFound("project not found");
  }
}

export async function listAuthorProjectsBySlug(
  slug: string,
  viewerWallet?: string,
): Promise<FeedProjectResponse[]> {
  const author = await getAuthorProfileBySlug(slug);
  const projects = await repo.listPublishedProjectsByAuthorId(author._id);
  return Promise.all(
    projects.map((project) =>
      buildFeedProjectResponse(
        project,
        author,
        viewerWallet ? normalizeWallet(viewerWallet) : undefined,
      ),
    ),
  );
}

export async function getAuthorProjectBySlugAndId(
  slug: string,
  projectId: string,
  viewerWallet?: string,
): Promise<ProjectDoc> {
  const author = await getAuthorProfileBySlug(slug);
  const objectId = parseObjectId(projectId, "projectId");
  const project = await repo.findPublishedProjectByIdAndAuthorId(
    objectId,
    author._id,
  );
  if (!project) {
    throw APIError.notFound("project not found");
  }

  const resolvedPolicy = resolveEntityPolicy(
    project.policyMode,
    author.defaultPolicy,
    project.policy,
  );

  const evaluation = evaluateAccessPolicy(
    resolvedPolicy,
    await buildAccessEvaluationContext(
      author._id,
      resolvedPolicy,
      viewerWallet,
    ),
  );

  if (!evaluation.allowed) {
    throw APIError.permissionDenied("access to this project is restricted");
  }

  return project;
}

export async function listMyProjectNodes(
  walletAddress: string,
  projectId: string,
  parentId?: string | null,
): Promise<ProjectNodeListResponse> {
  const { project } = await getMyProjectContext(walletAddress, projectId);
  const currentFolder = await resolveProjectFolder(
    project,
    parentId ?? project.rootNodeId.toHexString(),
  );
  const nodes = await repo.listProjectNodesByParent(
    project._id,
    currentFolder._id,
  );

  return {
    nodes: nodes.map(toProjectNodeResponse),
    currentFolderId: currentFolder._id.toHexString(),
    breadcrumbs: (await buildProjectBreadcrumbs(project, currentFolder)).map(
      toProjectNodeResponse,
    ),
  };
}

export async function listAuthorProjectNodesBySlug(
  slug: string,
  projectId: string,
  parentId?: string | null,
  viewerWallet?: string,
): Promise<ProjectNodeListResponse> {
  const project = await getAuthorProjectBySlugAndId(
    slug,
    projectId,
    viewerWallet,
  );
  const currentFolder = await resolveProjectFolder(
    project,
    parentId ?? project.rootNodeId.toHexString(),
  );
  await assertPublishedProjectPath(project, currentFolder);
  const nodes = await repo.listPublishedProjectNodesByParent(
    project._id,
    currentFolder._id,
  );

  return {
    nodes: nodes.map(toProjectNodeResponse),
    currentFolderId: currentFolder._id.toHexString(),
    breadcrumbs: (await buildProjectBreadcrumbs(project, currentFolder)).map(
      toProjectNodeResponse,
    ),
  };
}

export async function getMyProjectBundle(
  walletAddress: string,
  projectId: string,
  folderId?: string | null,
): Promise<ProjectBundleResponse> {
  const { project } = await getMyProjectContext(walletAddress, projectId);
  const folder = await resolveProjectFolder(
    project,
    folderId ?? project.rootNodeId.toHexString(),
  );
  return buildProjectBundle(project, folder, false);
}

export async function getAuthorProjectBundleBySlug(
  slug: string,
  projectId: string,
  folderId?: string | null,
  viewerWallet?: string,
): Promise<ProjectBundleResponse> {
  const project = await getAuthorProjectBySlugAndId(
    slug,
    projectId,
    viewerWallet,
  );
  const folder = await resolveProjectFolder(
    project,
    folderId ?? project.rootNodeId.toHexString(),
  );
  await assertPublishedProjectPath(project, folder);
  return buildProjectBundle(project, folder, true);
}

export async function createMyProjectFolder(
  walletAddress: string,
  projectId: string,
  input: CreateProjectFolderRequest,
): Promise<ProjectNodeDoc> {
  const { author, project } = await getMyProjectContext(
    walletAddress,
    projectId,
  );
  const parent = await resolveProjectFolder(
    project,
    input.parentId ?? project.rootNodeId.toHexString(),
  );
  const now = new Date();

  return repo.createProjectNode({
    _id: new ObjectId(),
    authorId: author._id,
    projectId: project._id,
    parentId: parent._id,
    kind: "folder",
    name: normalizeProjectNodeName(input.name),
    storageKey: null,
    mimeType: null,
    size: null,
    visibility: input.visibility ?? "published",
    createdAt: now,
    updatedAt: now,
  });
}

export async function uploadMyProjectFile(
  walletAddress: string,
  projectId: string,
  input: {
    parentId?: string | null;
    name: string;
    body: Buffer;
    contentType: string;
  },
): Promise<ProjectNodeDoc> {
  const { author, project } = await getMyProjectContext(
    walletAddress,
    projectId,
  );
  await assertAuthorStorageQuota(author, input.body.length);
  const parent = await resolveProjectFolder(
    project,
    input.parentId ?? project.rootNodeId.toHexString(),
  );
  const now = new Date();
  const nodeId = new ObjectId();
  const name = normalizeProjectNodeName(input.name);
  const storageKey = createProjectObjectKey({
    authorId: author._id.toHexString(),
    projectId: project._id.toHexString(),
    nodeId: nodeId.toHexString(),
    fileName: name,
  });

  await putObject(
    storageKey,
    input.body,
    input.contentType || "application/octet-stream",
  );

  return repo.createProjectNode({
    _id: nodeId,
    authorId: author._id,
    projectId: project._id,
    parentId: parent._id,
    kind: "file",
    name,
    storageKey,
    mimeType: input.contentType || "application/octet-stream",
    size: input.body.length,
    visibility: "published",
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateMyProjectNode(
  walletAddress: string,
  projectId: string,
  nodeId: string,
  input: UpdateProjectNodeRequest,
): Promise<ProjectNodeDoc> {
  const { project } = await getMyProjectContext(walletAddress, projectId);
  const node = await resolveProjectNode(project, nodeId);
  if (node._id.equals(project.rootNodeId)) {
    throw APIError.invalidArgument("project root cannot be updated here");
  }

  const update: Parameters<typeof repo.updateProjectNode>[2] = {
    updatedAt: new Date(),
  };

  if (input.name !== undefined) {
    update.name = normalizeProjectNodeName(input.name);
  }

  if (input.visibility !== undefined) {
    update.visibility = input.visibility;
  }

  if (input.parentId !== undefined) {
    const parent = await resolveProjectFolder(project, input.parentId);
    if (parent._id.equals(node._id)) {
      throw APIError.invalidArgument("folder cannot be moved into itself");
    }
    update.parentId = parent._id;
  }

  const updated = await repo.updateProjectNode(node._id, project._id, update);
  if (!updated) {
    throw APIError.notFound("project node not found");
  }

  return updated;
}

export async function deleteMyProjectNode(
  walletAddress: string,
  projectId: string,
  nodeId: string,
): Promise<void> {
  const { project } = await getMyProjectContext(walletAddress, projectId);
  const node = await resolveProjectNode(project, nodeId);
  if (node._id.equals(project.rootNodeId)) {
    throw APIError.invalidArgument("project root cannot be deleted");
  }

  const descendants =
    node.kind === "folder"
      ? await repo.findProjectNodeChildrenRecursive(project._id, node._id)
      : [];
  const nodesToDelete = [node, ...descendants];

  for (const item of nodesToDelete) {
    if (item.kind === "file" && item.storageKey) {
      await deleteObject(item.storageKey);
    }
  }

  await repo.deleteProjectNodes(nodesToDelete.map((item) => item._id));
}

export async function getMyProjectFile(
  walletAddress: string,
  projectId: string,
  nodeId: string,
): Promise<{ body: Buffer; contentType: string; fileName: string }> {
  const { project } = await getMyProjectContext(walletAddress, projectId);
  const node = await resolveProjectNode(project, nodeId);
  return readProjectFileObject(node);
}

export async function getAuthorProjectFileBySlug(
  slug: string,
  projectId: string,
  nodeId: string,
  viewerWallet?: string,
): Promise<{ body: Buffer; contentType: string; fileName: string }> {
  const project = await getAuthorProjectBySlugAndId(
    slug,
    projectId,
    viewerWallet,
  );
  const node = await resolveProjectNode(project, nodeId);
  if (node.visibility !== "published") {
    throw APIError.permissionDenied("access to this file is restricted");
  }
  if (node.parentId) {
    const parent = await resolveProjectFolder(
      project,
      node.parentId.toHexString(),
    );
    await assertPublishedProjectPath(project, parent);
  }
  return readProjectFileObject(node);
}

export async function createAuthorProfile(
  walletAddress: string,
  input: CreateAuthorProfileRequest,
): Promise<AuthorProfileDoc> {
  const user = await getOrCreateUserByWallet(walletAddress);
  const existing = await repo.findAuthorProfileByUserId(user._id.toHexString());
  if (existing) {
    throw APIError.alreadyExists("author profile already exists");
  }

  const slug = normalizeSlug(input.slug);
  const existingSlug = await repo.findAuthorProfileBySlug(slug);
  if (existingSlug) {
    throw APIError.alreadyExists("author slug already exists");
  }

  const displayName = normalizeDisplayName(input.displayName);
  const bio = normalizeBio(input.bio ?? "");
  const tags = normalizeAuthorTags(input.tags ?? []);
  const defaultPolicy = await normalizeRequestedAuthorDefaultPolicy(
    null,
    input.defaultPolicy,
    input.defaultPolicyInput,
  );
  const now = new Date();

  const author = await createAuthorProfileOrThrowConflict({
    userId: user._id.toHexString(),
    slug,
    displayName,
    bio,
    tags,
    avatarFileId: user.avatarFileId,
    defaultPolicy,
    defaultPolicyId: null,
    subscriptionPlanId: null,
    createdAt: now,
    updatedAt: now,
  });

  const preset = await repo.createAccessPolicyPreset({
    authorId: author._id,
    name: "Default access",
    description: "Default access policy for inherited content.",
    policy: defaultPolicy,
    isDefault: true,
    createdAt: now,
    updatedAt: now,
  });

  const updated = await repo.updateAuthorProfile(author._id, {
    defaultPolicyId: preset._id,
    updatedAt: now,
  });

  return updated ?? { ...author, defaultPolicyId: preset._id };
}

async function createAuthorProfileOrThrowConflict(
  doc: Omit<AuthorProfileDoc, "_id">,
): Promise<AuthorProfileDoc> {
  try {
    return await repo.createAuthorProfile(doc);
  } catch (error) {
    if (isMongoDuplicateKeyError(error)) {
      throw APIError.alreadyExists("author slug already exists");
    }

    throw error;
  }
}

export function toUserProfileResponse(user: UserDoc): UserProfileResponse {
  return {
    id: user._id.toHexString(),
    username: user.username ?? null,
    displayName: user.displayName,
    bio: user.bio,
    avatarFileId: user.avatarFileId?.toHexString() ?? null,
    primaryWallet: user.primaryWallet,
    wallets: user.wallets.map((wallet) => ({
      address: wallet.address,
      kind: wallet.kind,
      addedAt: wallet.addedAt.toISOString(),
    })),
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export function toAuthorProfileResponse(
  author: AuthorProfileDoc,
): AuthorProfileResponse {
  return {
    id: author._id.toHexString(),
    userId: author.userId,
    slug: author.slug,
    displayName: author.displayName,
    bio: author.bio,
    tags: author.tags ?? [],
    avatarFileId: author.avatarFileId?.toHexString() ?? null,
    defaultPolicy: author.defaultPolicy,
    defaultPolicyId: author.defaultPolicyId?.toHexString() ?? null,
    subscriptionPlanId: author.subscriptionPlanId?.toHexString() ?? null,
    createdAt: author.createdAt.toISOString(),
    updatedAt: author.updatedAt.toISOString(),
  };
}

export function toAuthorStorageUsageResponse(
  author: AuthorProfileDoc,
  usage: AuthorStorageUsageStats,
): AuthorStorageUsageResponse {
  return {
    authorId: author._id.toHexString(),
    postsBytes: usage.postsBytes,
    projectsBytes: usage.projectsBytes,
    totalUsedBytes: usage.postsBytes + usage.projectsBytes,
  };
}

export function toAccessPolicyPresetResponse(
  preset: AccessPolicyPresetDoc,
): AccessPolicyPresetResponse {
  return {
    id: preset._id.toHexString(),
    authorId: preset.authorId.toHexString(),
    name: preset.name,
    description: preset.description,
    policy: preset.policy,
    isDefault: preset.isDefault,
    postsCount: 0,
    projectsCount: 0,
    paidSubscribersCount: 0,
    createdAt: preset.createdAt.toISOString(),
    updatedAt: preset.updatedAt.toISOString(),
  };
}

async function toAccessPolicyPresetResponseWithUsage(
  preset: AccessPolicyPresetDoc,
): Promise<AccessPolicyPresetResponse> {
  const [postsCount, projectsCount] = await Promise.all([
    repo.countPostsByAccessPolicyId(preset.authorId, preset._id),
    repo.countProjectsByAccessPolicyId(preset.authorId, preset._id),
  ]);
  const planIds = collectSubscriptionPlanIds(preset.policy.root).map(
    (id) => new ObjectId(id),
  );
  const paidSubscribersCount = planIds.length
    ? await repo.countActiveSubscriptionEntitlementsByPlanIds(
        planIds,
        new Date(),
      )
    : 0;

  return {
    ...toAccessPolicyPresetResponse(preset),
    postsCount,
    projectsCount,
    paidSubscribersCount,
  };
}

export function toSubscriptionEntitlementResponse(
  entitlement: SubscriptionEntitlementDoc,
): SubscriptionEntitlementResponse {
  return {
    id: entitlement._id.toHexString(),
    authorId: entitlement.authorId.toHexString(),
    subscriberWallet: entitlement.subscriberWallet,
    planId: entitlement.planId.toHexString(),
    status: entitlement.status,
    validUntil: entitlement.validUntil.toISOString(),
    source: entitlement.source,
    createdAt: entitlement.createdAt.toISOString(),
    updatedAt: entitlement.updatedAt.toISOString(),
  };
}

export function toContractDeploymentResponse(
  deployment: ContractDeploymentDoc,
): ContractDeploymentResponse {
  return {
    id: deployment._id.toHexString(),
    chainId: deployment.chainId,
    contractName: deployment.contractName,
    address: deployment.address,
    platformTreasury: deployment.platformTreasury,
    deployedBy: deployment.deployedBy,
    deploymentTxHash: deployment.deploymentTxHash,
    createdAt: deployment.createdAt.toISOString(),
    updatedAt: deployment.updatedAt.toISOString(),
  };
}

export function toSubscriptionPaymentIntentResponse(
  intent: SubscriptionPaymentIntentDoc,
): SubscriptionPaymentIntentResponse {
  return {
    id: intent._id.toHexString(),
    authorId: intent.authorId.toHexString(),
    subscriberWallet: intent.subscriberWallet,
    planId: intent.planId.toHexString(),
    planCode: intent.planCode,
    planKey: intent.planKey,
    paymentAsset: intent.paymentAsset ?? "erc20",
    chainId: intent.chainId,
    tokenAddress: intent.tokenAddress,
    contractAddress: intent.contractAddress,
    price: intent.price,
    billingPeriodDays: intent.billingPeriodDays,
    status: intent.status,
    txHash: intent.txHash,
    entitlementId: intent.entitlementId?.toHexString() ?? null,
    paidUntil: intent.paidUntil?.toISOString() ?? null,
    expiresAt: intent.expiresAt.toISOString(),
    createdAt: intent.createdAt.toISOString(),
    updatedAt: intent.updatedAt.toISOString(),
  };
}

export function toSubscriptionPlanResponse(
  plan: SubscriptionPlanDoc,
  activeSubscribersCount = 0,
): SubscriptionPlanResponse {
  return {
    id: plan._id.toHexString(),
    authorId: plan.authorId.toHexString(),
    code: plan.code,
    title: plan.title,
    paymentAsset: plan.paymentAsset ?? "erc20",
    chainId: plan.chainId,
    tokenAddress: plan.tokenAddress,
    price: plan.price,
    billingPeriodDays: plan.billingPeriodDays,
    contractAddress: plan.contractAddress,
    planKey:
      plan.planKey ??
      buildPlanKey(plan.authorId.toHexString(), plan.code, plan.chainId),
    registrationTxHash: plan.registrationTxHash ?? null,
    active: plan.active,
    activeSubscribersCount,
    createdAt: plan.createdAt.toISOString(),
    updatedAt: plan.updatedAt.toISOString(),
  };
}

export async function toSubscriptionPlanResponseWithStats(
  plan: SubscriptionPlanDoc,
): Promise<SubscriptionPlanResponse> {
  return toSubscriptionPlanResponse(
    plan,
    await repo.countActiveSubscriptionEntitlementsByPlanId(
      plan._id,
      new Date(),
    ),
  );
}

export function toPostResponse(
  post: PostDoc,
  stats?: {
    likesCount?: number;
    commentsCount?: number;
    viewsCount?: number;
    likedByMe?: boolean;
    attachments?: PostAttachmentDoc[];
  },
): PostResponse {
  return {
    id: post._id.toHexString(),
    authorId: post.authorId.toHexString(),
    title: post.title,
    content: post.content,
    status: post.status,
    policyMode: post.policyMode,
    policy: post.policy,
    accessPolicyId: post.accessPolicyId?.toHexString() ?? null,
    attachmentIds: (post.attachmentIds ?? []).map((id) => id.toHexString()),
    attachments: (stats?.attachments ?? []).map(toPostAttachmentResponse),
    linkedProjectIds: (post.linkedProjectIds ?? []).map((id) =>
      id.toHexString(),
    ),
    likesCount: stats?.likesCount ?? 0,
    commentsCount: stats?.commentsCount ?? 0,
    viewsCount: stats?.viewsCount ?? 0,
    likedByMe: stats?.likedByMe ?? false,
    publishedAt: post.publishedAt?.toISOString() ?? null,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  };
}

export function toPostAttachmentResponse(
  attachment: PostAttachmentDoc,
): PostAttachmentResponse {
  return {
    id: attachment._id.toHexString(),
    postId: attachment.postId.toHexString(),
    authorId: attachment.authorId.toHexString(),
    kind: attachment.kind,
    fileName: attachment.fileName,
    mimeType: attachment.mimeType,
    size: attachment.size,
    createdAt: attachment.createdAt.toISOString(),
  };
}

export function toPostCommentResponse(
  comment: PostCommentDoc,
): PostCommentResponse {
  return {
    id: comment._id.toHexString(),
    postId: comment.postId.toHexString(),
    authorId: comment.authorId.toHexString(),
    walletAddress: comment.walletAddress,
    displayName: comment.displayName,
    content: comment.content,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
  };
}

export async function buildPostResponse(
  post: PostDoc,
  viewerWallet?: string,
): Promise<PostResponse> {
  return toPostResponse(post, await buildPostStats(post, viewerWallet));
}

export function toFeedPostResponse(
  post: PostDoc,
  author: AuthorProfileDoc,
  access?: {
    accessLabel: string | null;
    hasAccess: boolean;
    stats?: {
      likesCount?: number;
      commentsCount?: number;
      viewsCount?: number;
      likedByMe?: boolean;
      attachments?: PostAttachmentDoc[];
    };
  },
): FeedPostResponse {
  return {
    ...toPostResponse(post, access?.stats),
    authorSlug: author.slug,
    authorDisplayName: author.displayName,
    accessLabel: access?.accessLabel ?? null,
    hasAccess: access?.hasAccess ?? true,
  };
}

async function buildFeedPostResponse(
  post: PostDoc,
  author: AuthorProfileDoc,
  viewerWallet?: string,
): Promise<FeedPostResponse> {
  const resolvedPolicy = resolveEntityPolicy(
    post.policyMode,
    author.defaultPolicy,
    post.policy,
  );
  const [plans, accessContext] = await Promise.all([
    repo.listSubscriptionPlansByAuthorId(author._id),
    buildAccessEvaluationContext(author._id, resolvedPolicy, viewerWallet),
  ]);
  const evaluation = evaluateAccessPolicy(resolvedPolicy, accessContext);
  const hasAccess = evaluation.allowed;

  const stats = await buildPostStats(post, viewerWallet);
  const visibleStats = hasAccess ? stats : { ...stats, attachments: [] };

  return toFeedPostResponse(
    {
      ...post,
      content: hasAccess ? post.content : "",
    },
    author,
    {
      accessLabel: describeAccessPolicy(resolvedPolicy.root, plans),
      hasAccess,
      stats: visibleStats,
    },
  );
}

function describeAccessPolicy(
  node: AccessPolicyNode,
  plans: SubscriptionPlanDoc[],
): string | null {
  const planById = new Map(
    plans.map((plan) => [plan._id.toHexString(), plan.title || plan.code]),
  );

  return describeAccessPolicyNode(node, planById);
}

function describeAccessPolicyNode(
  node: AccessPolicyNode,
  planById: Map<string, string>,
): string {
  switch (node.type) {
    case "public":
      return "Public";
    case "subscription":
      return planById.get(node.planId) ?? "Subscription";
    case "token_balance":
      return "Token balance";
    case "nft_ownership":
      return "NFT ownership";
    case "and":
      return `AND: ${node.children
        .map((child) => describeAccessPolicyNode(child, planById))
        .join(" + ")}`;
    case "or":
      return `OR: ${node.children
        .map((child) => describeAccessPolicyNode(child, planById))
        .join(" / ")}`;
    default:
      return "Custom access";
  }
}

export function toProjectResponse(
  project: ProjectDoc,
  stats?: { fileCount: number; folderCount: number; totalSize: number },
): ProjectResponse {
  return {
    id: project._id.toHexString(),
    authorId: project.authorId.toHexString(),
    title: project.title,
    description: project.description,
    status: project.status,
    policyMode: project.policyMode,
    policy: project.policy,
    accessPolicyId: project.accessPolicyId?.toHexString() ?? null,
    rootNodeId: project.rootNodeId.toHexString(),
    fileCount: stats?.fileCount ?? 0,
    folderCount: stats?.folderCount ?? 0,
    totalSize: stats?.totalSize ?? 0,
    publishedAt: project.publishedAt?.toISOString() ?? null,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}

export async function buildProjectResponse(
  project: ProjectDoc,
): Promise<ProjectResponse> {
  return toProjectResponse(
    project,
    await repo.getProjectNodeStats(project._id),
  );
}

export function toProjectNodeResponse(
  node: ProjectNodeDoc,
): ProjectNodeResponse {
  return {
    id: node._id.toHexString(),
    authorId: node.authorId.toHexString(),
    projectId: node.projectId.toHexString(),
    parentId: node.parentId?.toHexString() ?? null,
    kind: node.kind,
    name: node.name,
    storageKey: node.storageKey,
    mimeType: node.mimeType,
    size: node.size,
    visibility: node.visibility,
    createdAt: node.createdAt.toISOString(),
    updatedAt: node.updatedAt.toISOString(),
  };
}

export function toFeedProjectResponse(
  project: ProjectDoc,
  author: AuthorProfileDoc,
  access?: {
    accessLabel: string | null;
    hasAccess: boolean;
    stats?: { fileCount: number; folderCount: number; totalSize: number };
  },
): FeedProjectResponse {
  return {
    ...toProjectResponse(project, access?.stats),
    authorSlug: author.slug,
    authorDisplayName: author.displayName,
    accessLabel: access?.accessLabel ?? null,
    hasAccess: access?.hasAccess ?? true,
  };
}

async function buildFeedProjectResponse(
  project: ProjectDoc,
  author: AuthorProfileDoc,
  viewerWallet?: string,
): Promise<FeedProjectResponse> {
  const resolvedPolicy = resolveEntityPolicy(
    project.policyMode,
    author.defaultPolicy,
    project.policy,
  );
  const [plans, accessContext, stats] = await Promise.all([
    repo.listSubscriptionPlansByAuthorId(author._id),
    buildAccessEvaluationContext(author._id, resolvedPolicy, viewerWallet),
    repo.getProjectNodeStats(project._id),
  ]);
  const evaluation = evaluateAccessPolicy(resolvedPolicy, accessContext);
  const hasAccess = evaluation.allowed;

  return toFeedProjectResponse(
    {
      ...project,
      description: hasAccess ? project.description : "",
    },
    author,
    {
      accessLabel: describeAccessPolicy(resolvedPolicy.root, plans),
      hasAccess,
      stats,
    },
  );
}

function normalizeWallet(walletAddress: string): string {
  const value = walletAddress.trim().toLowerCase();
  if (!value) {
    throw APIError.invalidArgument("wallet address is required");
  }
  return value;
}

function isMongoDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === 11000
  );
}

function normalizePaymentAsset(value: string): "erc20" | "native" {
  if (value === "erc20" || value === "native") {
    return value;
  }

  throw APIError.invalidArgument("paymentAsset must be erc20 or native");
}

function normalizePlanTokenAddress(
  paymentAsset: "erc20" | "native",
  tokenAddress: string,
): string {
  if (paymentAsset === "native") {
    return ZERO_ADDRESS;
  }

  const normalized = normalizeWallet(tokenAddress);
  if (normalized === ZERO_ADDRESS) {
    throw APIError.invalidArgument("ERC-20 token address is required");
  }

  return normalized;
}

function normalizeUsername(username: string | null): string | null {
  if (username === null) {
    return null;
  }

  const value = username.trim().toLowerCase();
  if (!value) {
    return null;
  }

  if (!/^[a-z0-9_]{3,32}$/.test(value)) {
    throw APIError.invalidArgument("username must be 3-32 chars: a-z, 0-9, _");
  }

  return value;
}

function normalizeDisplayName(displayName: string): string {
  const value = displayName.trim();
  if (!value) {
    throw APIError.invalidArgument("display name is required");
  }

  if (value.length > 80) {
    throw APIError.invalidArgument("display name is too long");
  }

  return value;
}

function normalizeBio(bio: string): string {
  const value = bio.trim();
  if (value.length > 500) {
    throw APIError.invalidArgument("bio is too long");
  }
  return value;
}

function normalizeAuthorTags(tags: string[]): string[] {
  if (!Array.isArray(tags)) {
    throw APIError.invalidArgument("tags must be an array");
  }

  const normalized = tags
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean)
    .filter((tag, index, list) => list.indexOf(tag) === index);

  if (normalized.length > 12) {
    throw APIError.invalidArgument("author can have up to 12 tags");
  }

  for (const tag of normalized) {
    if (!/^[a-z0-9- ]{2,32}$/.test(tag)) {
      throw APIError.invalidArgument(
        "tags must be 2-32 chars: a-z, 0-9, space, -",
      );
    }
  }

  return normalized;
}

function normalizeSlug(slug: string): string {
  const value = slug.trim().toLowerCase();
  if (!/^[a-z0-9-]{3,50}$/.test(value)) {
    throw APIError.invalidArgument("slug must be 3-50 chars: a-z, 0-9, -");
  }
  return value;
}

function normalizePlanTitle(title: string): string {
  const value = title.trim();
  if (!value) {
    throw APIError.invalidArgument("plan title is required");
  }
  if (value.length > 120) {
    throw APIError.invalidArgument("plan title is too long");
  }
  return value;
}

function normalizePresetName(name: string): string {
  const value = name.trim();
  if (!value) {
    throw APIError.invalidArgument("access policy name is required");
  }
  if (value.length > 120) {
    throw APIError.invalidArgument("access policy name is too long");
  }
  return value;
}

function normalizePresetDescription(description: string): string {
  const value = description.trim();
  if (value.length > 500) {
    throw APIError.invalidArgument("access policy description is too long");
  }
  return value;
}

function normalizeChainId(chainId: number): number {
  if (!Number.isInteger(chainId) || chainId <= 0) {
    throw APIError.invalidArgument("chainId must be a positive integer");
  }
  return chainId;
}

function normalizeBillingPeriodDays(days: number): number {
  if (!Number.isInteger(days) || days <= 0 || days > 3650) {
    throw APIError.invalidArgument(
      "billingPeriodDays must be an integer between 1 and 3650",
    );
  }
  return days;
}

function normalizePositiveInteger(value: string, field: string): string {
  const normalized = value.trim();
  if (!/^[0-9]+$/.test(normalized)) {
    throw APIError.invalidArgument(
      `${field} must be a positive integer string`,
    );
  }
  if (BigInt(normalized) <= 0n) {
    throw APIError.invalidArgument(`${field} must be greater than zero`);
  }
  return normalized;
}

function normalizePostTitle(title: string): string {
  const value = title.trim();
  if (!value) {
    throw APIError.invalidArgument("post title is required");
  }
  if (value.length > 160) {
    throw APIError.invalidArgument("post title is too long");
  }
  return value;
}

function normalizePostContent(content: string): string {
  const value = content.trim();
  if (!value) {
    throw APIError.invalidArgument("post content is required");
  }
  if (value.length > 50000) {
    throw APIError.invalidArgument("post content is too long");
  }
  return value;
}

function normalizePostCommentContent(content: string): string {
  const value = content.trim();
  if (!value) {
    throw APIError.invalidArgument("comment content is required");
  }
  if (value.length > 1000) {
    throw APIError.invalidArgument("comment content is too long");
  }
  return value;
}

async function normalizeContentPolicy(
  author: AuthorProfileDoc,
  input:
    | CreatePostRequest
    | UpdatePostRequest
    | CreateProjectRequest
    | UpdateProjectRequest,
  policyMode: NonNullable<
    | CreatePostRequest["policyMode"]
    | UpdatePostRequest["policyMode"]
    | CreateProjectRequest["policyMode"]
    | UpdateProjectRequest["policyMode"]
  >,
): Promise<{ policy: AccessPolicy | null; accessPolicyId: ObjectId | null }> {
  if (policyMode !== "custom") {
    return { policy: null, accessPolicyId: null };
  }

  if (input.accessPolicyId) {
    if (input.policy !== undefined || input.policyInput !== undefined) {
      throw APIError.invalidArgument(
        "provide either accessPolicyId or inline policy",
      );
    }

    const preset = await repo.findAccessPolicyPresetByIdAndAuthorId(
      parseObjectId(input.accessPolicyId, "accessPolicyId"),
      author._id,
    );
    if (!preset) {
      throw APIError.notFound("access policy preset not found");
    }

    return { policy: preset.policy, accessPolicyId: preset._id };
  }

  return {
    policy: await normalizeRequestedCustomPolicy(
      author,
      input.policy ?? null,
      input.policyInput,
    ),
    accessPolicyId: null,
  };
}

function normalizeAccessPolicy(policy: unknown, field: string) {
  if (!isAccessPolicy(policy)) {
    throw APIError.invalidArgument(`${field} is invalid`);
  }

  return policy;
}

function normalizeProjectTitle(title: string): string {
  const value = title.trim();
  if (!value) {
    throw APIError.invalidArgument("project title is required");
  }
  if (value.length > 160) {
    throw APIError.invalidArgument("project title is too long");
  }
  return value;
}

function normalizeProjectDescription(description: string): string {
  const value = description.trim();
  if (value.length > 5000) {
    throw APIError.invalidArgument("project description is too long");
  }
  return value;
}

function normalizeProjectNodeName(name: string): string {
  const value = name.trim();
  if (!value) {
    throw APIError.invalidArgument("project node name is required");
  }
  if (value.length > 160) {
    throw APIError.invalidArgument("project node name is too long");
  }
  if (value.includes("/") || value === "." || value === "..") {
    throw APIError.invalidArgument("project node name is invalid");
  }
  return value;
}

async function getMyProjectContext(
  walletAddress: string,
  projectId: string,
): Promise<{ author: AuthorProfileDoc; project: ProjectDoc }> {
  const author = await getMyAuthorProfile(walletAddress);
  const project = await repo.findProjectByIdAndAuthorId(
    parseObjectId(projectId, "projectId"),
    author._id,
  );
  if (!project) {
    throw APIError.notFound("project not found");
  }
  return { author, project };
}

async function resolveProjectNode(
  project: ProjectDoc,
  nodeId: string,
): Promise<ProjectNodeDoc> {
  const node = await repo.findProjectNodeByIdAndProjectId(
    parseObjectId(nodeId, "nodeId"),
    project._id,
  );
  if (!node) {
    throw APIError.notFound("project node not found");
  }
  return node;
}

async function resolveProjectFolder(
  project: ProjectDoc,
  folderId: string | null | undefined,
): Promise<ProjectNodeDoc> {
  const node = await resolveProjectNode(
    project,
    folderId ?? project.rootNodeId.toHexString(),
  );
  if (node.kind !== "folder") {
    throw APIError.invalidArgument("project node is not a folder");
  }
  return node;
}

async function buildProjectBreadcrumbs(
  project: ProjectDoc,
  folder: ProjectNodeDoc,
): Promise<ProjectNodeDoc[]> {
  const breadcrumbs: ProjectNodeDoc[] = [folder];
  let parentId = folder.parentId;

  while (parentId) {
    const parent = await repo.findProjectNodeByIdAndProjectId(
      parentId,
      project._id,
    );
    if (!parent) {
      break;
    }

    breadcrumbs.unshift(parent);
    parentId = parent.parentId;
  }

  return breadcrumbs;
}

async function buildProjectBundle(
  project: ProjectDoc,
  folder: ProjectNodeDoc,
  publishedOnly: boolean,
): Promise<ProjectBundleResponse> {
  const files: ProjectBundleResponse["files"] = [];
  let folderCount = 0;

  async function collect(
    parent: ProjectNodeDoc,
    basePath: string,
  ): Promise<void> {
    const children = publishedOnly
      ? await repo.listPublishedProjectNodesByParent(project._id, parent._id)
      : await repo.listProjectNodesByParent(project._id, parent._id);

    for (const child of children) {
      const path = basePath ? `${basePath}/${child.name}` : child.name;

      if (child.kind === "folder") {
        folderCount += 1;
        await collect(child, path);
        continue;
      }

      files.push({
        nodeId: child._id.toHexString(),
        name: child.name,
        path,
        mimeType: child.mimeType,
        size: child.size ?? 0,
      });
    }
  }

  await collect(folder, "");

  return {
    folderId: folder._id.toHexString(),
    files,
    fileCount: files.length,
    folderCount,
    totalSize: files.reduce((total, file) => total + file.size, 0),
  };
}

async function getReadablePostContext(
  slug: string,
  postId: string,
  viewerWallet?: string,
): Promise<{ author: AuthorProfileDoc; post: PostDoc }> {
  const author = await getAuthorProfileBySlug(slug);
  const objectId = parseObjectId(postId, "postId");
  const post = await repo.findPublishedPostByIdAndAuthorId(
    objectId,
    author._id,
  );
  if (!post) {
    throw APIError.notFound("post not found");
  }

  const resolvedPolicy = resolveEntityPolicy(
    post.policyMode,
    author.defaultPolicy,
    post.policy,
  );
  const evaluation = evaluateAccessPolicy(
    resolvedPolicy,
    await buildAccessEvaluationContext(
      author._id,
      resolvedPolicy,
      viewerWallet,
    ),
  );

  if (!evaluation.allowed) {
    throw APIError.permissionDenied("access to this post is restricted");
  }

  return { author, post };
}

async function buildPostStats(
  post: PostDoc,
  viewerWallet?: string,
): Promise<{
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
  likedByMe: boolean;
  attachments: PostAttachmentDoc[];
}> {
  const normalizedWallet = viewerWallet
    ? normalizeWallet(viewerWallet)
    : undefined;
  const [likesCount, commentsCount, viewsCount, like, attachments] =
    await Promise.all([
      repo.countPostLikes(post._id),
      repo.countPostComments(post._id),
      repo.countPostViews(post._id),
      normalizedWallet ? repo.findPostLike(post._id, normalizedWallet) : null,
      repo.listPostAttachments(post._id),
    ]);

  return {
    likesCount,
    commentsCount,
    viewsCount,
    likedByMe: Boolean(like),
    attachments,
  };
}

async function assertPublishedProjectPath(
  project: ProjectDoc,
  folder: ProjectNodeDoc,
): Promise<void> {
  const breadcrumbs = await buildProjectBreadcrumbs(project, folder);
  const hiddenNode = breadcrumbs.find(
    (node) =>
      !node._id.equals(project.rootNodeId) && node.visibility !== "published",
  );
  if (hiddenNode) {
    throw APIError.permissionDenied("access to this folder is restricted");
  }
}

async function readProjectFileObject(
  node: ProjectNodeDoc,
): Promise<{ body: Buffer; contentType: string; fileName: string }> {
  if (node.kind !== "file" || !node.storageKey) {
    throw APIError.invalidArgument("project node is not a file");
  }

  const object = await getObject(node.storageKey);
  return {
    body: object.body,
    contentType: object.contentType,
    fileName: node.name,
  };
}

async function normalizeRequestedAuthorDefaultPolicy(
  author: AuthorProfileDoc | null,
  policy:
    | CreateAuthorProfileRequest["defaultPolicy"]
    | UpdateAuthorProfileRequest["defaultPolicy"],
  policyInput:
    | CreateAuthorProfileRequest["defaultPolicyInput"]
    | UpdateAuthorProfileRequest["defaultPolicyInput"],
) {
  if (policy !== undefined && policyInput !== undefined) {
    throw APIError.invalidArgument(
      "provide either defaultPolicy or defaultPolicyInput",
    );
  }

  if (policyInput !== undefined) {
    return buildAccessPolicyFromInput(policyInput, author);
  }

  if (policy !== undefined) {
    return normalizeAccessPolicy(policy, "default policy");
  }

  return createPublicPolicy();
}

async function resolveDefaultPolicyFromPreset(
  author: AuthorProfileDoc,
  presetId: string | null,
): Promise<AccessPolicy> {
  if (!presetId) {
    return createPublicPolicy();
  }

  const preset = await repo.findAccessPolicyPresetByIdAndAuthorId(
    parseObjectId(presetId, "defaultPolicyId"),
    author._id,
  );
  if (!preset) {
    throw APIError.notFound("access policy preset not found");
  }
  return preset.policy;
}

async function normalizePresetPolicy(
  author: AuthorProfileDoc,
  policy:
    | CreateAccessPolicyPresetRequest["policy"]
    | UpdateAccessPolicyPresetRequest["policy"],
  policyInput:
    | CreateAccessPolicyPresetRequest["policyInput"]
    | UpdateAccessPolicyPresetRequest["policyInput"],
) {
  if (policy !== undefined && policyInput !== undefined) {
    throw APIError.invalidArgument("provide either policy or policyInput");
  }
  if (policyInput !== undefined) {
    return buildAccessPolicyFromInput(policyInput, author);
  }
  return normalizeAccessPolicy(policy ?? createPublicPolicy(), "access policy");
}

async function normalizeRequestedCustomPolicy(
  author: AuthorProfileDoc,
  policy: CreatePostRequest["policy"] | CreateProjectRequest["policy"],
  policyInput:
    | CreatePostRequest["policyInput"]
    | CreateProjectRequest["policyInput"],
) {
  if (policy !== undefined && policyInput !== undefined) {
    throw APIError.invalidArgument("provide either policy or policyInput");
  }

  if (policyInput !== undefined) {
    return buildAccessPolicyFromInput(policyInput, author);
  }

  if (!policy || !isAccessPolicy(policy)) {
    throw APIError.invalidArgument("custom policy is required");
  }

  return policy;
}

function resolvePublishedAt(
  currentPublishedAt: Date | null,
  currentStatus: "draft" | "published" | "archived",
  nextStatus: "draft" | "published" | "archived",
): Date | null {
  if (nextStatus === "draft") {
    return null;
  }
  if (nextStatus === "archived") {
    return currentPublishedAt;
  }

  if (currentStatus === "published" && currentPublishedAt) {
    return currentPublishedAt;
  }

  return new Date();
}

function normalizeAttachmentIds(attachmentIds: string[]): ObjectId[] {
  return attachmentIds.map((id) => new ObjectId(id));
}

async function normalizeLinkedProjectIds(
  author: AuthorProfileDoc,
  projectIds: string[],
): Promise<ObjectId[]> {
  const objectIds = projectIds.map((id) =>
    parseObjectId(id, "linkedProjectId"),
  );
  const uniqueIds = uniqueObjectIds(objectIds);

  for (const projectId of uniqueIds) {
    const project = await repo.findProjectByIdAndAuthorId(
      projectId,
      author._id,
    );
    if (!project) {
      throw APIError.invalidArgument("linked project was not found");
    }
  }

  return uniqueIds;
}

function resolvePostAttachmentKind(mimeType: string) {
  if (mimeType.startsWith("image/")) {
    return "image" as const;
  }
  if (mimeType.startsWith("video/")) {
    return "video" as const;
  }
  if (mimeType.startsWith("audio/")) {
    return "audio" as const;
  }
  return "file" as const;
}

async function resolvePostAttachment(
  post: PostDoc,
  attachmentId: string,
): Promise<PostAttachmentDoc> {
  const attachment = await repo.findPostAttachmentByIdAndPostId(
    parseObjectId(attachmentId, "attachmentId"),
    post._id,
  );
  if (!attachment) {
    throw APIError.notFound("post attachment not found");
  }
  return attachment;
}

async function readPostAttachmentObject(
  attachment: PostAttachmentDoc,
): Promise<{ body: Buffer; contentType: string; fileName: string }> {
  const object = await getObject(attachment.storageKey);
  return {
    body: object.body,
    contentType: object.contentType,
    fileName: attachment.fileName,
  };
}

function parseObjectId(value: string, field: string): ObjectId {
  if (!ObjectId.isValid(value)) {
    throw APIError.invalidArgument(`${field} is invalid`);
  }

  return new ObjectId(value);
}

function uniqueObjectIds(ids: ObjectId[]): ObjectId[] {
  const seen = new Set<string>();
  const result: ObjectId[] = [];
  for (const id of ids) {
    const key = id.toHexString();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(id);
  }

  return result;
}

async function buildSubscriptionGrants(
  authorId: ObjectId,
  viewerWallet: string,
) {
  const entitlements =
    await repo.listSubscriptionEntitlementsByWalletAndAuthorId(
      normalizeWallet(viewerWallet),
      authorId,
    );

  return entitlements.map((entitlement) => ({
    authorId: entitlement.authorId.toHexString(),
    planId: entitlement.planId.toHexString(),
    validUntil: entitlement.validUntil.toISOString(),
    active:
      entitlement.status === "active" &&
      entitlement.validUntil.getTime() > Date.now(),
  }));
}

async function buildAccessEvaluationContext(
  authorId: ObjectId,
  policy: AccessPolicy,
  viewerWallet?: string,
): Promise<AccessEvaluationContext> {
  const normalizedWallet = viewerWallet
    ? normalizeWallet(viewerWallet)
    : undefined;
  if (!normalizedWallet) {
    return {
      subscriptions: [],
      tokenBalances: [],
      nftOwnerships: [],
    };
  }

  const [subscriptions, onChainGrants] = await Promise.all([
    buildSubscriptionGrants(authorId, normalizedWallet),
    readOnChainAccessGrants(policy, normalizedWallet),
  ]);

  return {
    subscriptions,
    tokenBalances: onChainGrants.tokenBalances,
    nftOwnerships: onChainGrants.nftOwnerships,
  };
}

function policyUsesSubscriptionPlan(
  node: AccessPolicyNode,
  planId: string,
): boolean {
  if (node.type === "subscription") {
    return node.planId === planId;
  }

  if (node.type === "and" || node.type === "or") {
    return node.children.some((child) =>
      policyUsesSubscriptionPlan(child, planId),
    );
  }

  return false;
}

async function buildAccessPolicyConditionResponses(
  node: AccessPolicyNode,
  context: AccessEvaluationContext,
  plansById: Map<string, SubscriptionPlanDoc>,
): Promise<AccessPolicyConditionResponse[]> {
  const conditions = collectPolicyConditionNodes(node);

  return Promise.all(
    conditions.map(async (condition) => {
      switch (condition.type) {
        case "subscription": {
          const plan = plansById.get(condition.planId);
          if (!plan) {
            return null;
          }
          const subscription = context.subscriptions?.find(
            (grant) =>
              grant.authorId === condition.authorId &&
              grant.planId === condition.planId &&
              grant.active,
          );
          const validUntil =
            context.subscriptions?.find(
              (grant) => grant.planId === condition.planId && grant.active,
            )?.validUntil ?? null;

          return {
            type: "subscription" as const,
            plan: await toSubscriptionPlanResponseWithStats(plan),
            satisfied: Boolean(subscription),
            validUntil,
          };
        }
        case "token_balance": {
          const grant = context.tokenBalances?.find(
            (entry) =>
              entry.chainId === condition.chainId &&
              entry.contractAddress.toLowerCase() ===
                condition.contractAddress.toLowerCase(),
          );

          return {
            type: "token_balance" as const,
            chainId: condition.chainId,
            contractAddress: condition.contractAddress,
            minAmount: condition.minAmount,
            decimals: condition.decimals,
            satisfied: grant
              ? BigInt(grant.balance) >= BigInt(condition.minAmount)
              : false,
            currentBalance: grant?.balance ?? null,
          };
        }
        case "nft_ownership": {
          const grant = context.nftOwnerships?.find((entry) => {
            if (
              entry.chainId !== condition.chainId ||
              entry.contractAddress.toLowerCase() !==
                condition.contractAddress.toLowerCase() ||
              entry.standard !== condition.standard
            ) {
              return false;
            }

            return !condition.tokenId || entry.tokenId === condition.tokenId;
          });
          const minBalance = condition.minBalance ?? "1";

          return {
            type: "nft_ownership" as const,
            chainId: condition.chainId,
            contractAddress: condition.contractAddress,
            standard: condition.standard,
            tokenId: condition.tokenId,
            minBalance: condition.minBalance,
            satisfied: grant
              ? BigInt(grant.balance ?? "0") >= BigInt(minBalance)
              : false,
            currentBalance: grant?.balance ?? null,
          };
        }
        default:
          return null;
      }
    }),
  ).then((items) =>
    items.filter((item): item is AccessPolicyConditionResponse =>
      Boolean(item),
    ),
  );
}

function collectPolicyConditionNodes(
  node: AccessPolicyNode,
): AccessPolicyNode[] {
  if (node.type === "and" || node.type === "or") {
    return node.children.flatMap((child) => collectPolicyConditionNodes(child));
  }

  return node.type === "public" ? [] : [node];
}

function collectSubscriptionPlanIds(node: AccessPolicyNode): string[] {
  return collectPolicyConditionNodes(node).flatMap((condition) =>
    condition.type === "subscription" ? [condition.planId] : [],
  );
}

function getConditionMode(node: AccessPolicyNode): "single" | "and" | "or" {
  return node.type === "and" || node.type === "or" ? node.type : "single";
}

function shortenWallet(walletAddress: string): string {
  if (walletAddress.length <= 10) {
    return walletAddress;
  }

  return `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
}

async function getAuthorMainSubscriptionPlan(
  author: AuthorProfileDoc,
): Promise<SubscriptionPlanDoc | null> {
  if (author.subscriptionPlanId) {
    const byId = await repo.findSubscriptionPlanById(author.subscriptionPlanId);
    if (byId) {
      return byId;
    }
  }

  return repo.findSubscriptionPlanByAuthorIdAndCode(author._id, "main");
}

export async function buildAccessPolicyFromInput(
  policyInput:
    | NonNullable<CreateAuthorProfileRequest["defaultPolicyInput"]>
    | NonNullable<UpdateAuthorProfileRequest["defaultPolicyInput"]>
    | NonNullable<CreatePostRequest["policyInput"]>
    | NonNullable<CreateProjectRequest["policyInput"]>,
  author: AuthorProfileDoc | null,
): Promise<AccessPolicy> {
  return {
    version: ACCESS_POLICY_VERSION as 1,
    root: await buildAccessPolicyNodeFromInput(policyInput.root, author),
  };
}

async function buildAccessPolicyNodeFromInput(
  node:
    | NonNullable<
        NonNullable<CreateAuthorProfileRequest["defaultPolicyInput"]>["root"]
      >
    | NonNullable<
        NonNullable<UpdateAuthorProfileRequest["defaultPolicyInput"]>["root"]
      >
    | NonNullable<NonNullable<CreatePostRequest["policyInput"]>["root"]>
    | NonNullable<NonNullable<CreateProjectRequest["policyInput"]>["root"]>,
  author: AuthorProfileDoc | null,
): Promise<AccessPolicyNode> {
  switch (node.type) {
    case "public":
      return { type: "public" } as const;
    case "subscription": {
      if (!author) {
        throw APIError.invalidArgument(
          "subscription policy input requires an existing author profile",
        );
      }

      const planCode = normalizePlanCode(
        node.planCode && node.planCode.trim() ? node.planCode : "main",
      );
      const plan = await repo.findSubscriptionPlanByAuthorIdAndCode(
        author._id,
        planCode,
      );
      if (!plan) {
        throw APIError.invalidArgument(
          `subscription plan with code '${planCode}' was not found`,
        );
      }

      return {
        type: "subscription",
        authorId: author._id.toHexString(),
        planId: plan._id.toHexString(),
      } as const;
    }
    case "token_balance":
      return {
        type: "token_balance",
        chainId: normalizeChainId(node.chainId),
        contractAddress: normalizeWallet(node.contractAddress),
        minAmount: normalizePositiveInteger(node.minAmount, "minAmount"),
        decimals: normalizeTokenDecimals(node.decimals),
      } as const;
    case "nft_ownership":
      return {
        type: "nft_ownership",
        chainId: normalizeChainId(node.chainId),
        contractAddress: normalizeWallet(node.contractAddress),
        standard: normalizeNftStandard(node.standard),
        tokenId: normalizeOptionalIdString(node.tokenId),
        minBalance:
          node.minBalance === undefined
            ? undefined
            : normalizePositiveInteger(node.minBalance, "minBalance"),
      } as const;
    case "or":
      return {
        type: "or",
        children: await Promise.all(
          node.children.map((child) =>
            buildAccessPolicyNodeFromInput(child, author),
          ),
        ),
      } as const;
    case "and":
      return {
        type: "and",
        children: await Promise.all(
          node.children.map((child) =>
            buildAccessPolicyNodeFromInput(child, author),
          ),
        ),
      } as const;
    default:
      throw APIError.invalidArgument("policy input node type is not supported");
  }
}

function normalizePlanCode(code: string) {
  const value = code.trim().toLowerCase();
  if (!/^[a-z0-9_-]{1,32}$/.test(value)) {
    throw APIError.invalidArgument("planCode is invalid");
  }
  return value;
}

function normalizeTokenDecimals(decimals: number) {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 255) {
    throw APIError.invalidArgument(
      "decimals must be an integer between 0 and 255",
    );
  }
  return decimals;
}

function normalizeNftStandard(standard: string) {
  if (standard !== "erc721" && standard !== "erc1155") {
    throw APIError.invalidArgument("standard must be erc721 or erc1155");
  }
  return standard;
}

function normalizeOptionalIdString(value: string | undefined) {
  if (value === undefined) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    throw APIError.invalidArgument("tokenId is invalid");
  }

  return trimmed;
}

function normalizeTxHash(txHash: string): string {
  const value = txHash.trim().toLowerCase();
  if (!/^0x[a-f0-9]{64}$/.test(value)) {
    throw APIError.invalidArgument(
      "txHash must be a 32-byte hex transaction hash",
    );
  }
  return value;
}

function normalizePlanKey(planKey: string): string {
  const value = planKey.trim().toLowerCase();
  if (!/^0x[a-f0-9]{64}$/.test(value)) {
    throw APIError.invalidArgument("planKey must be a 32-byte hex value");
  }
  return value;
}

function buildPlanKey(authorId: string, code: string, chainId: number): string {
  return hashId(`usecontent:${chainId}:${authorId}:${code}`).toLowerCase();
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}
