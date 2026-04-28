import { APIError } from "encore.dev/api";
import { id as hashId } from "ethers";
import { ObjectId } from "mongodb";
import {
  ACCESS_CONDITION_MODE,
  ACCESS_POLICY_NODE_TYPE,
  CONTENT_STATUS,
  CONTENT_VISIBILITY,
  type ContentStatus,
  NFT_STANDARD,
  PAYMENT_ASSET,
  POST_PROMOTION_STATUS,
  SUBSCRIPTION_ENTITLEMENT_STATUS,
  type PaymentAsset,
  ZERO_ADDRESS,
} from "../../shared/consts";
import type { PaginatedResponse } from "../../shared/types/common";
import {
  isSameAddressLike,
  isZeroAddress,
  normalizeHexString,
} from "../../shared/utils";
import type { AccessPolicyPresetDoc } from "../access/doc-types";
import * as accessRepo from "../access/repository";
import type { ContractDeploymentDoc } from "../contracts/doc-types";
import * as contractDeploymentsRepo from "../contracts/repository";
import {
  ACCESS_POLICY_VERSION,
  createPublicPolicy,
  evaluateAccessPolicy,
  isAccessPolicy,
  resolveEntityPolicy,
  type AccessEvaluationContext,
  type AccessPolicy,
  type AccessPolicyNode,
} from "../domain/access";
import type {
  AccessPolicyConditionResponse,
  AccessPolicyPresetResponse,
  AuthorProfileResponse,
  AuthorStorageUsageResponse,
  ContractDeploymentResponse,
  CreateAccessPolicyPresetRequest,
  CreateAuthorProfileRequest,
  CreatePostRequest,
  CreateProjectRequest,
  FeedPostResponse,
  FeedProjectResponse,
  PlatformSubscriptionPaymentIntentResponse,
  PostAttachmentResponse,
  PostCommentResponse,
  PostReportResponse,
  PostResponse,
  ProjectBundleResponse,
  ProjectNodeResponse,
  ProjectResponse,
  SubscriptionEntitlementResponse,
  SubscriptionPaymentIntentResponse,
  SubscriptionPlanResponse,
  UpdateAccessPolicyPresetRequest,
  UpdateAuthorProfileRequest,
  UpdatePostRequest,
  UpdateProjectRequest,
  UserProfileResponse,
} from "../lib/content-types";
import { readOnChainAccessGrants } from "../onchain";
import type {
  AuthorStorageUsageStats,
  PlatformSubscriptionPaymentIntentDoc,
} from "../platform/doc-types";
import * as platformRepo from "../platform/repository";
import type {
  PostAttachmentDoc,
  PostCommentDoc,
  PostDoc,
  PostReportDoc,
} from "../posts/doc-types";
import { readPostAttachmentFile } from "../posts/file-storage";
import * as postsRepo from "../posts/repository";
import type { AuthorProfileDoc, UserDoc } from "../profiles/doc-types";
import * as profilesRepo from "../profiles/repository";
import {
  getAuthorProfileBySlug,
  getMyAuthorProfile,
} from "../profiles/service";
import type { ProjectDoc, ProjectNodeDoc } from "../projects/doc-types";
import { readProjectFile } from "../projects/file-storage";
import * as projectsRepo from "../projects/repository";
import type {
  SubscriptionEntitlementDoc,
  SubscriptionPaymentIntentDoc,
  SubscriptionPlanDoc,
} from "../subscriptions/doc-types";
import * as subscriptionsRepo from "../subscriptions/repository";
import { addMinutes } from "./utils/dates";
import {
  isMongoDuplicateKeyError,
  parseObjectId,
  uniqueObjectIds,
} from "./utils/mongo";
import { normalizeWallet, shortenWallet } from "./utils/wallet";

const repo = {
  ...accessRepo,
  ...contractDeploymentsRepo,
  ...platformRepo,
  ...postsRepo,
  ...profilesRepo,
  ...projectsRepo,
  ...subscriptionsRepo,
};

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

export async function toAccessPolicyPresetResponseWithUsage(
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
    paymentAsset: intent.paymentAsset ?? PAYMENT_ASSET.ERC20,
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

export function toPlatformSubscriptionPaymentIntentResponse(
  intent: PlatformSubscriptionPaymentIntentDoc,
): PlatformSubscriptionPaymentIntentResponse {
  return {
    id: intent._id.toHexString(),
    authorId: intent.authorId.toHexString(),
    walletAddress: intent.walletAddress,
    planCode: intent.planCode,
    tierKey: intent.tierKey,
    extraStorageGb: intent.extraStorageGb,
    chainId: intent.chainId,
    tokenAddress: intent.tokenAddress,
    contractAddress: intent.contractAddress,
    amount: intent.amount,
    status: intent.status,
    txHash: intent.txHash,
    validUntil: intent.validUntil?.toISOString() ?? null,
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
    paymentAsset: plan.paymentAsset ?? PAYMENT_ASSET.ERC20,
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
    promotion:
      post.promoted && post.promotionStatus === POST_PROMOTION_STATUS.ACTIVE
        ? {
            active: true,
            promotedAt: post.promotedAt?.toISOString() ?? null,
          }
        : null,
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

export function toPostReportResponse(
  report: PostReportDoc,
): PostReportResponse {
  return {
    id: report._id.toHexString(),
    postId: report.postId.toHexString(),
    authorId: report.authorId.toHexString(),
    reporterWallet: report.reporterWallet,
    reason: report.reason,
    comment: report.comment,
    status: report.status,
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString(),
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
    commentsPreview?: PostCommentDoc[];
    feedReason?: string | null;
    feedSource?: FeedPostResponse["feedSource"];
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
    feedSource: access?.feedSource ?? "author",
    feedReason: access?.feedReason ?? null,
    commentsPreview: (access?.commentsPreview ?? []).map(toPostCommentResponse),
  };
}

export async function buildFeedPostResponse(
  post: PostDoc,
  author: AuthorProfileDoc,
  viewerWallet?: string,
  feed?: {
    reason?: string | null;
    source?: FeedPostResponse["feedSource"];
  },
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

  const [stats, commentsPreview] = await Promise.all([
    buildPostStats(post, viewerWallet),
    repo.listPostCommentsPreview(post._id, 3),
  ]);
  const visibleStats = hasAccess ? stats : { ...stats, attachments: [] };

  return toFeedPostResponse(
    {
      ...post,
      content: hasAccess ? post.content : "",
    },
    author,
    {
      accessLabel: describeAccessPolicy(resolvedPolicy.root, plans),
      commentsPreview: hasAccess ? commentsPreview : [],
      feedReason: feed?.reason ?? null,
      feedSource: feed?.source ?? "author",
      hasAccess,
      stats: visibleStats,
    },
  );
}

export function toPaginatedResponse<T>(
  items: T[],
  requestedLimit: number,
  getCursor: (item: T) => string | null,
): PaginatedResponse<T> {
  const hasMore = items.length > requestedLimit;
  const pageItems = hasMore ? items.slice(0, requestedLimit) : items;
  const lastItem = pageItems.at(-1);

  return {
    items: pageItems,
    nextCursor: lastItem ? getCursor(lastItem) : null,
    hasMore,
  };
}

export function describeAccessPolicy(
  node: AccessPolicyNode,
  plans: SubscriptionPlanDoc[],
): string | null {
  const planById = new Map(
    plans.map((plan) => [plan._id.toHexString(), plan.title || plan.code]),
  );

  return describeAccessPolicyNode(node, planById);
}

export function describeAccessPolicyNode(
  node: AccessPolicyNode,
  planById: Map<string, string>,
): string {
  switch (node.type) {
    case ACCESS_POLICY_NODE_TYPE.PUBLIC:
      return "Public";
    case ACCESS_POLICY_NODE_TYPE.SUBSCRIPTION:
      return planById.get(node.planId) ?? "Subscription";
    case ACCESS_POLICY_NODE_TYPE.TOKEN_BALANCE:
      return "Token balance";
    case ACCESS_POLICY_NODE_TYPE.NFT_OWNERSHIP:
      return "NFT ownership";
    case ACCESS_POLICY_NODE_TYPE.AND:
      return `AND: ${node.children
        .map((child) => describeAccessPolicyNode(child, planById))
        .join(" + ")}`;
    case ACCESS_POLICY_NODE_TYPE.OR:
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

export async function buildFeedProjectResponse(
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

export function normalizePaymentAsset(value: string): PaymentAsset {
  if (value === PAYMENT_ASSET.ERC20 || value === PAYMENT_ASSET.NATIVE) {
    return value;
  }

  throw APIError.invalidArgument("paymentAsset must be erc20 or native");
}

export function normalizePlanTokenAddress(
  paymentAsset: PaymentAsset,
  tokenAddress: string,
): string {
  if (paymentAsset === PAYMENT_ASSET.NATIVE) {
    return ZERO_ADDRESS;
  }

  const normalized = normalizeWallet(tokenAddress);
  if (isZeroAddress(normalized)) {
    throw APIError.invalidArgument("ERC-20 token address is required");
  }

  return normalized;
}

export function normalizeUsername(username: string | null): string | null {
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

export function normalizeDisplayName(displayName: string): string {
  const value = displayName.trim();
  if (!value) {
    throw APIError.invalidArgument("display name is required");
  }

  if (value.length > 80) {
    throw APIError.invalidArgument("display name is too long");
  }

  return value;
}

export function normalizeBio(bio: string): string {
  const value = bio.trim();
  if (value.length > 500) {
    throw APIError.invalidArgument("bio is too long");
  }
  return value;
}

export function normalizeAuthorTags(tags: string[]): string[] {
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

export function normalizeSlug(slug: string): string {
  const value = slug.trim().toLowerCase();
  if (!/^[a-z0-9-]{3,50}$/.test(value)) {
    throw APIError.invalidArgument("slug must be 3-50 chars: a-z, 0-9, -");
  }
  return value;
}

export function normalizePlanTitle(title: string): string {
  const value = title.trim();
  if (!value) {
    throw APIError.invalidArgument("plan title is required");
  }
  if (value.length > 120) {
    throw APIError.invalidArgument("plan title is too long");
  }
  return value;
}

export function normalizePresetName(name: string): string {
  const value = name.trim();
  if (!value) {
    throw APIError.invalidArgument("access policy name is required");
  }
  if (value.length > 120) {
    throw APIError.invalidArgument("access policy name is too long");
  }
  return value;
}

export function normalizePresetDescription(description: string): string {
  const value = description.trim();
  if (value.length > 500) {
    throw APIError.invalidArgument("access policy description is too long");
  }
  return value;
}

export function normalizeChainId(chainId: number): number {
  if (!Number.isInteger(chainId) || chainId <= 0) {
    throw APIError.invalidArgument("chainId must be a positive integer");
  }
  return chainId;
}

export function normalizeBillingPeriodDays(days: number): number {
  if (!Number.isInteger(days) || days <= 0 || days > 3650) {
    throw APIError.invalidArgument(
      "billingPeriodDays must be an integer between 1 and 3650",
    );
  }
  return days;
}

export function normalizePositiveInteger(value: string, field: string): string {
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

export function normalizePostTitle(title: string): string {
  const value = title.trim();
  if (!value) {
    throw APIError.invalidArgument("post title is required");
  }
  if (value.length > 160) {
    throw APIError.invalidArgument("post title is too long");
  }
  return value;
}

export function normalizePostContent(content: string): string {
  const value = content.trim();
  if (!value) {
    throw APIError.invalidArgument("post content is required");
  }
  if (value.length > 50000) {
    throw APIError.invalidArgument("post content is too long");
  }
  return value;
}

export function normalizePostCommentContent(content: string): string {
  const value = content.trim();
  if (!value) {
    throw APIError.invalidArgument("comment content is required");
  }
  if (value.length > 1000) {
    throw APIError.invalidArgument("comment content is too long");
  }
  return value;
}

export async function normalizeContentPolicy(
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

export function normalizeAccessPolicy(policy: unknown, field: string) {
  if (!isAccessPolicy(policy)) {
    throw APIError.invalidArgument(`${field} is invalid`);
  }

  return policy;
}

export function normalizeProjectTitle(title: string): string {
  const value = title.trim();
  if (!value) {
    throw APIError.invalidArgument("project title is required");
  }
  if (value.length > 160) {
    throw APIError.invalidArgument("project title is too long");
  }
  return value;
}

export function normalizeProjectDescription(description: string): string {
  const value = description.trim();
  if (value.length > 5000) {
    throw APIError.invalidArgument("project description is too long");
  }
  return value;
}

export function normalizeProjectNodeName(name: string): string {
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

export async function getMyProjectContext(
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

export async function resolveProjectNode(
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

export async function resolveProjectFolder(
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

export async function buildProjectBreadcrumbs(
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

export async function buildProjectBundle(
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

export async function getReadablePostContext(
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

export async function buildPostStats(
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

export async function assertPublishedProjectPath(
  project: ProjectDoc,
  folder: ProjectNodeDoc,
): Promise<void> {
  const breadcrumbs = await buildProjectBreadcrumbs(project, folder);
  const hiddenNode = breadcrumbs.find(
    (node) =>
      !node._id.equals(project.rootNodeId) &&
      node.visibility !== CONTENT_VISIBILITY.PUBLISHED,
  );
  if (hiddenNode) {
    throw APIError.permissionDenied("access to this folder is restricted");
  }
}

export async function readProjectFileObject(
  node: ProjectNodeDoc,
): Promise<{ body: Buffer; contentType: string; fileName: string }> {
  if (node.kind !== "file" || !node.storageKey) {
    throw APIError.invalidArgument("project node is not a file");
  }
  return readProjectFile(node);
}

export async function normalizeRequestedAuthorDefaultPolicy(
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

export async function resolveDefaultPolicyFromPreset(
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

export async function normalizePresetPolicy(
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

export async function normalizeRequestedCustomPolicy(
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

export function resolvePublishedAt(
  currentPublishedAt: Date | null,
  currentStatus: ContentStatus,
  nextStatus: ContentStatus,
): Date | null {
  if (nextStatus === CONTENT_STATUS.DRAFT) {
    return null;
  }
  if (nextStatus === CONTENT_STATUS.ARCHIVED) {
    return currentPublishedAt;
  }

  if (currentStatus === CONTENT_STATUS.PUBLISHED && currentPublishedAt) {
    return currentPublishedAt;
  }

  return new Date();
}

export function normalizeAttachmentIds(attachmentIds: string[]): ObjectId[] {
  return attachmentIds.map((id) => new ObjectId(id));
}

export async function normalizeLinkedProjectIds(
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

export function resolvePostAttachmentKind(mimeType: string) {
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

export async function resolvePostAttachment(
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

export async function readPostAttachmentObject(
  attachment: PostAttachmentDoc,
): Promise<{ body: Buffer; contentType: string; fileName: string }> {
  return readPostAttachmentFile(attachment);
}

export async function buildSubscriptionGrants(
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
      entitlement.status === SUBSCRIPTION_ENTITLEMENT_STATUS.ACTIVE &&
      entitlement.validUntil.getTime() > Date.now(),
  }));
}

export async function buildAccessEvaluationContext(
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

export function policyUsesSubscriptionPlan(
  node: AccessPolicyNode,
  planId: string,
): boolean {
  if (node.type === ACCESS_POLICY_NODE_TYPE.SUBSCRIPTION) {
    return node.planId === planId;
  }

  if (
    node.type === ACCESS_POLICY_NODE_TYPE.AND ||
    node.type === ACCESS_POLICY_NODE_TYPE.OR
  ) {
    return node.children.some((child) =>
      policyUsesSubscriptionPlan(child, planId),
    );
  }

  return false;
}

export async function buildAccessPolicyConditionResponses(
  node: AccessPolicyNode,
  context: AccessEvaluationContext,
  plansById: Map<string, SubscriptionPlanDoc>,
): Promise<AccessPolicyConditionResponse[]> {
  const conditions = collectPolicyConditionNodes(node);

  return Promise.all(
    conditions.map(async (condition) => {
      switch (condition.type) {
        case ACCESS_POLICY_NODE_TYPE.SUBSCRIPTION: {
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
            type: ACCESS_POLICY_NODE_TYPE.SUBSCRIPTION,
            plan: await toSubscriptionPlanResponseWithStats(plan),
            satisfied: Boolean(subscription),
            validUntil,
          };
        }
        case ACCESS_POLICY_NODE_TYPE.TOKEN_BALANCE: {
          const grant = context.tokenBalances?.find(
            (entry) =>
              entry.chainId === condition.chainId &&
              isSameAddressLike(
                entry.contractAddress,
                condition.contractAddress,
              ),
          );

          return {
            type: ACCESS_POLICY_NODE_TYPE.TOKEN_BALANCE,
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
        case ACCESS_POLICY_NODE_TYPE.NFT_OWNERSHIP: {
          const grant = context.nftOwnerships?.find((entry) => {
            if (
              entry.chainId !== condition.chainId ||
              !isSameAddressLike(
                entry.contractAddress,
                condition.contractAddress,
              ) ||
              entry.standard !== condition.standard
            ) {
              return false;
            }

            return !condition.tokenId || entry.tokenId === condition.tokenId;
          });
          const minBalance = condition.minBalance ?? "1";

          return {
            type: ACCESS_POLICY_NODE_TYPE.NFT_OWNERSHIP,
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

export function collectPolicyConditionNodes(
  node: AccessPolicyNode,
): AccessPolicyNode[] {
  if (
    node.type === ACCESS_POLICY_NODE_TYPE.AND ||
    node.type === ACCESS_POLICY_NODE_TYPE.OR
  ) {
    return node.children.flatMap((child) => collectPolicyConditionNodes(child));
  }

  return node.type === ACCESS_POLICY_NODE_TYPE.PUBLIC ? [] : [node];
}

export function collectSubscriptionPlanIds(node: AccessPolicyNode): string[] {
  return collectPolicyConditionNodes(node).flatMap((condition) =>
    condition.type === ACCESS_POLICY_NODE_TYPE.SUBSCRIPTION
      ? [condition.planId]
      : [],
  );
}

export function getConditionMode(
  node: AccessPolicyNode,
): "single" | "and" | "or" {
  return node.type === ACCESS_POLICY_NODE_TYPE.AND ||
    node.type === ACCESS_POLICY_NODE_TYPE.OR
    ? node.type
    : ACCESS_CONDITION_MODE.SINGLE;
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

export async function buildAccessPolicyNodeFromInput(
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
    case ACCESS_POLICY_NODE_TYPE.PUBLIC:
      return { type: ACCESS_POLICY_NODE_TYPE.PUBLIC } as const;
    case ACCESS_POLICY_NODE_TYPE.SUBSCRIPTION: {
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
        type: ACCESS_POLICY_NODE_TYPE.SUBSCRIPTION,
        authorId: author._id.toHexString(),
        planId: plan._id.toHexString(),
      } as const;
    }
    case ACCESS_POLICY_NODE_TYPE.TOKEN_BALANCE:
      return {
        type: ACCESS_POLICY_NODE_TYPE.TOKEN_BALANCE,
        chainId: normalizeChainId(node.chainId),
        contractAddress: normalizeWallet(node.contractAddress),
        minAmount: normalizePositiveInteger(node.minAmount, "minAmount"),
        decimals: normalizeTokenDecimals(node.decimals),
      } as const;
    case ACCESS_POLICY_NODE_TYPE.NFT_OWNERSHIP:
      return {
        type: ACCESS_POLICY_NODE_TYPE.NFT_OWNERSHIP,
        chainId: normalizeChainId(node.chainId),
        contractAddress: normalizeWallet(node.contractAddress),
        standard: normalizeNftStandard(node.standard),
        tokenId: normalizeOptionalIdString(node.tokenId),
        minBalance:
          node.minBalance === undefined
            ? undefined
            : normalizePositiveInteger(node.minBalance, "minBalance"),
      } as const;
    case ACCESS_POLICY_NODE_TYPE.OR:
      return {
        type: ACCESS_POLICY_NODE_TYPE.OR,
        children: await Promise.all(
          node.children.map((child) =>
            buildAccessPolicyNodeFromInput(child, author),
          ),
        ),
      } as const;
    case ACCESS_POLICY_NODE_TYPE.AND:
      return {
        type: ACCESS_POLICY_NODE_TYPE.AND,
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

export function normalizePlanCode(code: string) {
  const value = code.trim().toLowerCase();
  if (!/^[a-z0-9_-]{1,32}$/.test(value)) {
    throw APIError.invalidArgument("planCode is invalid");
  }
  return value;
}

export function normalizeTokenDecimals(decimals: number) {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 255) {
    throw APIError.invalidArgument(
      "decimals must be an integer between 0 and 255",
    );
  }
  return decimals;
}

export function normalizeNftStandard(standard: string) {
  if (standard !== NFT_STANDARD.ERC721 && standard !== NFT_STANDARD.ERC1155) {
    throw APIError.invalidArgument("standard must be erc721 or erc1155");
  }
  return standard;
}

export function normalizeOptionalIdString(value: string | undefined) {
  if (value === undefined) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    throw APIError.invalidArgument("tokenId is invalid");
  }

  return trimmed;
}

export function normalizeTxHash(txHash: string): string {
  const value = normalizeHexString(txHash);
  if (!/^0x[a-f0-9]{64}$/.test(value)) {
    throw APIError.invalidArgument(
      "txHash must be a 32-byte hex transaction hash",
    );
  }
  return value;
}

export function normalizePlanKey(planKey: string): string {
  const value = normalizeHexString(planKey);
  if (!/^0x[a-f0-9]{64}$/.test(value)) {
    throw APIError.invalidArgument("planKey must be a 32-byte hex value");
  }
  return value;
}

export function buildPlanKey(
  authorId: string,
  code: string,
  chainId: number,
): string {
  return hashId(`usecontent:${chainId}:${authorId}:${code}`).toLowerCase();
}

export {
  addMinutes,
  isMongoDuplicateKeyError,
  normalizeWallet,
  parseObjectId,
  shortenWallet,
  uniqueObjectIds,
};
