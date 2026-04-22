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
  createPostAttachmentObjectKey,
  createProjectObjectKey,
  deleteObject,
  getObject,
  putObject,
} from "../storage/object-storage";
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
import { assertAuthorPlatformFeature, assertAuthorStorageQuota } from "../platform/service";
import { listMyEntitlements } from "../subscriptions/service";
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
