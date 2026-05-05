import { APIError } from "encore.dev/api";
import { ObjectId } from "mongodb";
import {
  CONTENT_STATUS,
  PLATFORM_FEATURE,
  POST_PROMOTION_STATUS,
  POST_REPORT_REASON,
  POST_REPORT_STATUS,
  SUBSCRIPTION_ENTITLEMENT_STATUS,
} from "../../shared/consts";
import type { PaginatedResponse } from "../../shared/types/common";
import * as accessRepo from "../access/repository";
import * as contractDeploymentsRepo from "../contracts/repository";
import { evaluateAccessPolicy, resolveEntityPolicy } from "../domain/access";
import {
  buildAccessEvaluationContext,
  buildFeedPostResponse,
  getReadablePostContext,
  hydratePostComments,
  normalizeAttachmentIds,
  normalizeContentPolicy,
  normalizeLinkedProjectIds,
  normalizePostMediaLayout,
  normalizePostCommentContent,
  normalizePostContent,
  normalizePostTitle,
  normalizeProjectNodeName,
  normalizeWallet,
  parseObjectId,
  readPostAttachmentObject,
  resolvePostAttachment,
  resolvePostAttachmentKind,
  resolvePublishedAt,
  toPaginatedResponse,
  uniqueObjectIds,
} from "../lib/content-common";
import type {
  CreatePostCommentRequest,
  CreatePostReportRequest,
  CreatePostRequest,
  FeedPostResponse,
  PostAttachmentDoc,
  PostCommentDoc,
  PostDoc,
  PostReportDoc,
  UpdatePostRequest,
} from "../lib/content-types";
import * as platformRepo from "../platform/repository";
import type { PublishedPostCursor } from "../posts/repository";
import * as postsRepo from "../posts/repository";
import * as profilesRepo from "../profiles/repository";
import * as projectsRepo from "../projects/repository";
import * as subscriptionsRepo from "../subscriptions/repository";
import {
  createPostAttachmentStorageKey,
  deletePostAttachmentFile,
  uploadPostAttachmentFile,
} from "./file-storage";

const repo = {
  ...accessRepo,
  ...contractDeploymentsRepo,
  ...platformRepo,
  ...postsRepo,
  ...profilesRepo,
  ...projectsRepo,
  ...subscriptionsRepo,
};

import {
  recordNewPostActivity,
  recordPostCommentedActivity,
  recordPostLikedActivity,
} from "../activity/events";
import {
  assertAuthorPlatformFeature,
  assertAuthorStorageQuota,
} from "../platform/service";
import {
  getAuthorProfileBySlug,
  getMyAuthorProfile,
  getOrCreateUserByWallet,
} from "../profiles/service";
import { listMyEntitlements } from "../subscriptions/service";
export async function listMyFeedPosts(
  walletAddress: string,
  pagination: FeedPaginationRequest = {},
): Promise<PaginatedResponse<FeedPostResponse>> {
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
    return { items: [], nextCursor: null, hasMore: false };
  }
  const page = normalizeFeedPagination(pagination);

  const [authors, posts] = await Promise.all([
    repo.findAuthorProfilesByIds(activeAuthorIds),
    repo.listPublishedPostsPage({
      authorIds: activeAuthorIds,
      cursor: page.cursor,
      limit: page.limit + 1,
    }),
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

      return buildFeedPostResponse(post, author, normalizedWallet, {
        reason: "From your active subscriptions",
        source: "subscribed",
      });
    }),
  );

  return toPaginatedResponse(
    feedPosts.filter((post): post is FeedPostResponse => Boolean(post)),
    page.limit,
    encodeFeedCursorFromFeedPost,
  );
}

export async function listExploreFeedPosts(
  viewerWallet?: string,
  pagination: FeedPaginationRequest & ExploreFeedFilterRequest = {},
): Promise<PaginatedResponse<FeedPostResponse>> {
  const page = normalizeFeedPagination(pagination);
  const filters = normalizeExploreFeedFilters(pagination);
  const normalizedWallet = viewerWallet
    ? normalizeWallet(viewerWallet)
    : undefined;
  const subscribedAuthorIds = normalizedWallet
    ? await getActiveSubscribedAuthorIds(normalizedWallet)
    : [];
  const publicPosts = await repo.listPublishedPostsPage({
    cursor: page.cursor,
    limit: page.limit + 8,
    search: filters.search,
  });
  const subscribedPosts = subscribedAuthorIds.length
    ? await repo.listPublishedPostsPage({
        authorIds: subscribedAuthorIds,
        cursor: page.cursor,
        limit: page.limit + 8,
        search: filters.search,
      })
    : [];
  const posts = rankHybridFeedPosts(
    publicPosts,
    subscribedPosts,
    subscribedAuthorIds,
  )
    .filter((post) =>
      matchesExploreFeedSource(post, subscribedAuthorIds, filters.source),
    )
    .slice(0, page.limit + 1);
  const authorIds = uniqueObjectIds(posts.map((post) => post.authorId));
  const authors = await repo.findAuthorProfilesByIds(authorIds);
  const authorById = new Map(
    authors.map((author) => [author._id.toHexString(), author]),
  );
  const subscribedAuthorIdSet = new Set(
    subscribedAuthorIds.map((authorId) => authorId.toHexString()),
  );

  const feedPosts = await Promise.all(
    posts.map(async (post) => {
      const author = authorById.get(post.authorId.toHexString());
      if (!author) {
        return null;
      }

      return buildFeedPostResponse(
        post,
        author,
        normalizedWallet,
        subscribedAuthorIdSet.has(post.authorId.toHexString())
          ? { reason: "From your active subscriptions", source: "subscribed" }
          : isPostPromotionActive(post)
            ? { reason: "Promoted by author", source: "promoted" }
            : { reason: "Published on useContent", source: "public" },
      );
    }),
  );

  return toPaginatedResponse(
    feedPosts.filter((post): post is FeedPostResponse => Boolean(post)),
    page.limit,
    encodeFeedCursorFromFeedPost,
  );
}

interface ExploreFeedFilterRequest {
  q?: string;
  source?: "all" | "public" | "subscribed" | "promoted";
}

function normalizeExploreFeedFilters(input: ExploreFeedFilterRequest): {
  search?: string;
  source: "all" | "public" | "subscribed" | "promoted";
} {
  const source =
    input.source === "public" ||
    input.source === "subscribed" ||
    input.source === "promoted"
      ? input.source
      : "all";
  const search = input.q?.trim();
  return {
    search: search || undefined,
    source,
  };
}

function matchesExploreFeedSource(
  post: PostDoc,
  subscribedAuthorIds: ObjectId[],
  source: "all" | "public" | "subscribed" | "promoted",
): boolean {
  if (source === "all") {
    return true;
  }
  const isSubscribed = subscribedAuthorIds.some((authorId) =>
    authorId.equals(post.authorId),
  );
  if (source === "subscribed") {
    return isSubscribed;
  }
  if (source === "promoted") {
    return isPostPromotionActive(post);
  }
  return !isSubscribed && !isPostPromotionActive(post);
}

async function getActiveSubscribedAuthorIds(
  walletAddress: string,
): Promise<ObjectId[]> {
  const entitlements = await listMyEntitlements(walletAddress);
  return uniqueObjectIds(
    entitlements
      .filter(
        (entitlement) =>
          entitlement.status === SUBSCRIPTION_ENTITLEMENT_STATUS.ACTIVE &&
          entitlement.validUntil.getTime() > Date.now(),
      )
      .map((entitlement) => entitlement.authorId),
  );
}

function rankHybridFeedPosts(
  publicPosts: PostDoc[],
  subscribedPosts: PostDoc[],
  subscribedAuthorIds: ObjectId[],
): PostDoc[] {
  const subscribedAuthorIdSet = new Set(
    subscribedAuthorIds.map((authorId) => authorId.toHexString()),
  );
  const postById = new Map<string, PostDoc>();
  for (const post of [...subscribedPosts, ...publicPosts]) {
    postById.set(post._id.toHexString(), post);
  }

  return [...postById.values()].sort((left, right) => {
    const leftScore = getHybridFeedScore(left, subscribedAuthorIdSet);
    const rightScore = getHybridFeedScore(right, subscribedAuthorIdSet);
    if (leftScore !== rightScore) {
      return rightScore - leftScore;
    }
    return right._id.toHexString().localeCompare(left._id.toHexString());
  });
}

function getHybridFeedScore(
  post: PostDoc,
  subscribedAuthorIdSet: Set<string>,
): number {
  const publishedAt = post.publishedAt?.getTime() ?? post.createdAt.getTime();
  const subscribedBoost = subscribedAuthorIdSet.has(post.authorId.toHexString())
    ? 10 * 60 * 1000
    : 0;
  const promotedBoost = isPostPromotionActive(post) ? 20 * 60 * 1000 : 0;
  return publishedAt + subscribedBoost + promotedBoost;
}

function isPostPromotionActive(post: PostDoc): boolean {
  return (
    post.promoted === true &&
    post.promotionStatus === POST_PROMOTION_STATUS.ACTIVE
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
  const status = input.status ?? CONTENT_STATUS.DRAFT;
  const policyMode = input.policyMode ?? "inherited";
  const policySelection = await normalizeContentPolicy(
    author,
    input,
    policyMode,
  );
  const attachmentIds = normalizeAttachmentIds(input.attachmentIds ?? []);
  const mediaSelection = normalizePostMediaLayout({
    attachmentIds: input.attachmentIds ?? [],
    mediaGridLayout: input.mediaGridLayout,
    mediaLayout: input.mediaLayout,
  });
  const linkedProjectIds = await normalizeLinkedProjectIds(
    author,
    input.linkedProjectIds ?? [],
  );

  resolveEntityPolicy(policyMode, author.defaultPolicy, policySelection.policy);

  const post = await repo.createPost({
    authorId: author._id,
    title,
    content,
    status,
    policyMode,
    policy: policySelection.policy,
    accessPolicyId: policySelection.accessPolicyId,
    mediaLayout: mediaSelection.mediaLayout,
    mediaGridLayout: mediaSelection.mediaGridLayout,
    attachmentIds,
    linkedProjectIds,
    promoted: false,
    promotedAt: null,
    promotionStatus: null,
    publishedAt: status === CONTENT_STATUS.PUBLISHED ? now : null,
    createdAt: now,
    updatedAt: now,
  });
  if (post.status === CONTENT_STATUS.PUBLISHED) {
    await recordNewPostActivity(post);
  }
  return post;
}

export async function listMyPosts(walletAddress: string): Promise<PostDoc[]> {
  const author = await getMyAuthorProfile(walletAddress);
  return repo.listPostsByAuthorId(author._id);
}

export async function listMyArchivedPosts(
  walletAddress: string,
): Promise<PostDoc[]> {
  const author = await getMyAuthorProfile(walletAddress);
  return repo.listPostsByAuthorId(author._id, CONTENT_STATUS.ARCHIVED);
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

  const shouldPausePromotion = nextStatus !== CONTENT_STATUS.PUBLISHED;
  const wasPublished = existing.status === CONTENT_STATUS.PUBLISHED;
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
    ...normalizePostMediaLayout({
      attachmentIds:
        input.attachmentIds === undefined
          ? existing.attachmentIds.map((id) => id.toHexString())
          : input.attachmentIds,
      mediaGridLayout:
        input.mediaGridLayout === undefined
          ? existing.mediaGridLayout
          : input.mediaGridLayout,
      mediaLayout:
        input.mediaLayout === undefined ? existing.mediaLayout : input.mediaLayout,
    }),
    attachmentIds:
      input.attachmentIds === undefined
        ? existing.attachmentIds
        : normalizeAttachmentIds(input.attachmentIds),
    linkedProjectIds:
      input.linkedProjectIds === undefined
        ? (existing.linkedProjectIds ?? [])
        : await normalizeLinkedProjectIds(author, input.linkedProjectIds),
    promoted: shouldPausePromotion ? false : (existing.promoted ?? false),
    promotedAt: existing.promotedAt ?? null,
    promotionStatus: shouldPausePromotion
      ? POST_PROMOTION_STATUS.PAUSED
      : (existing.promotionStatus ?? null),
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

  if (!wasPublished && updated.status === CONTENT_STATUS.PUBLISHED) {
    await recordNewPostActivity(updated);
  }
  return updated;
}

export async function promoteMyPost(
  walletAddress: string,
  postId: string,
): Promise<PostDoc> {
  const author = await getMyAuthorProfile(walletAddress);
  await assertAuthorPlatformFeature(author, PLATFORM_FEATURE.HOMEPAGE_PROMO);
  const objectId = parseObjectId(postId, "postId");
  const existing = await repo.findPostByIdAndAuthorId(objectId, author._id);
  if (!existing) {
    throw APIError.notFound("post not found");
  }
  if (existing.status !== CONTENT_STATUS.PUBLISHED) {
    throw APIError.failedPrecondition("only published posts can be promoted");
  }

  const now = new Date();
  const updated = await repo.updatePost(objectId, author._id, {
    promoted: true,
    promotedAt: existing.promotedAt ?? now,
    promotionStatus: POST_PROMOTION_STATUS.ACTIVE,
    updatedAt: now,
  });
  if (!updated) {
    throw APIError.notFound("post not found");
  }
  return updated;
}

export async function stopPromotingMyPost(
  walletAddress: string,
  postId: string,
): Promise<PostDoc> {
  const author = await getMyAuthorProfile(walletAddress);
  const objectId = parseObjectId(postId, "postId");
  const existing = await repo.findPostByIdAndAuthorId(objectId, author._id);
  if (!existing) {
    throw APIError.notFound("post not found");
  }

  const updated = await repo.updatePost(objectId, author._id, {
    promoted: false,
    promotionStatus: "paused",
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
    await deletePostAttachmentFile(attachment.storageKey);
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
  const storageKey = createPostAttachmentStorageKey({
    authorId: author._id.toHexString(),
    postId: post._id.toHexString(),
    attachmentId: attachmentId.toHexString(),
    fileName,
  });

  await uploadPostAttachmentFile(storageKey, input.body, mimeType);

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
  return hydratePostComments(await repo.listPostComments(post._id));
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

  const comment = await repo.createPostComment({
    _id: new ObjectId(),
    postId: post._id,
    authorId: post.authorId,
    walletAddress: viewerWallet,
    displayName: user.displayName,
    avatarFileId: user.avatarFileId,
    content: normalizePostCommentContent(input.content),
    createdAt: now,
    updatedAt: now,
  });
  await recordPostCommentedActivity(post, viewerWallet);
  return comment;
}

export async function createPostReportBySlug(
  slug: string,
  postId: string,
  walletAddress: string,
  input: CreatePostReportRequest,
): Promise<PostReportDoc> {
  const reporterWallet = normalizeWallet(walletAddress);
  const author = await getAuthorProfileBySlug(slug);
  const post = await repo.findPublishedPostByIdAndAuthorId(
    parseObjectId(postId, "postId"),
    author._id,
  );
  if (!post) {
    throw APIError.notFound("post not found");
  }
  if (post.policyMode !== "public" && !isPostPromotionActive(post)) {
    throw APIError.failedPrecondition(
      "only public or promoted posts can be reported",
    );
  }
  const existing = await repo.findPostReport(post._id, reporterWallet);
  if (existing) {
    throw APIError.failedPrecondition("post already reported");
  }
  const now = new Date();

  return repo.createPostReport({
    _id: new ObjectId(),
    postId: post._id,
    authorId: post.authorId,
    reporterWallet,
    reason: normalizePostReportReason(input.reason),
    comment: normalizePostReportComment(input.comment),
    status: POST_REPORT_STATUS.OPEN,
    createdAt: now,
    updatedAt: now,
  });
}

function normalizePostReportReason(value: string): PostReportDoc["reason"] {
  if (
    value === POST_REPORT_REASON.SPAM ||
    value === POST_REPORT_REASON.SCAM ||
    value === POST_REPORT_REASON.ILLEGAL_CONTENT ||
    value === POST_REPORT_REASON.ABUSE ||
    value === POST_REPORT_REASON.OTHER
  ) {
    return value;
  }
  throw APIError.invalidArgument("report reason is invalid");
}

function normalizePostReportComment(
  value: string | null | undefined,
): string | null {
  const normalized = String(value ?? "").trim();
  if (!normalized) {
    return null;
  }
  if (normalized.length > 1000) {
    throw APIError.invalidArgument("report comment is too long");
  }
  return normalized;
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
  await recordPostLikedActivity(post, viewerWallet);

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
  pagination: FeedPaginationRequest = {},
): Promise<PaginatedResponse<FeedPostResponse>> {
  const author = await getAuthorProfileBySlug(slug);
  const page = normalizeFeedPagination(pagination);
  const posts = await repo.listPublishedPostsPage({
    authorId: author._id,
    cursor: page.cursor,
    limit: page.limit + 1,
  });
  const feedPosts = await Promise.all(
    posts.map((post) =>
      buildFeedPostResponse(
        post,
        author,
        viewerWallet ? normalizeWallet(viewerWallet) : undefined,
        { reason: `From @${author.slug}`, source: "author" },
      ),
    ),
  );
  return toPaginatedResponse(
    feedPosts,
    page.limit,
    encodeFeedCursorFromFeedPost,
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

export interface FeedPaginationRequest {
  cursor?: string;
  limit?: number;
}

function normalizeFeedPagination(input: FeedPaginationRequest): {
  cursor: PublishedPostCursor | null;
  limit: number;
} {
  return {
    cursor: input.cursor ? decodeFeedCursor(input.cursor) : null,
    limit: Math.min(Math.max(Math.trunc(input.limit ?? 12), 1), 30),
  };
}

function encodeFeedCursorFromFeedPost(post: FeedPostResponse): string | null {
  return post.publishedAt ? encodeFeedCursor(post.publishedAt, post.id) : null;
}

function encodeFeedCursor(publishedAt: string, id: string): string {
  return Buffer.from(JSON.stringify({ id, publishedAt }), "utf8").toString(
    "base64url",
  );
}

function decodeFeedCursor(cursor: string): PublishedPostCursor {
  try {
    const value = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
    if (
      typeof value !== "object" ||
      value === null ||
      typeof value.id !== "string" ||
      typeof value.publishedAt !== "string"
    ) {
      throw new Error("invalid cursor payload");
    }

    const publishedAt = new Date(value.publishedAt);
    if (Number.isNaN(publishedAt.getTime())) {
      throw new Error("invalid cursor date");
    }

    return {
      id: parseObjectId(value.id, "cursor"),
      publishedAt,
    };
  } catch {
    throw APIError.invalidArgument("cursor is invalid");
  }
}
