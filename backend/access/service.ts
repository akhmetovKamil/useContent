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
} from "../onchain";
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
