import { api, type Header } from "encore.dev/api";
import {
  getOptionalViewerWallet,
  getRequiredWallet,
  parseFilePath,
  readRequestBody,
  writeFileResponse,
} from "../lib/api-helpers";
import * as service from "./service";
import type {
  CreatePostCommentRequest,
  CreatePostRequest,
  CreatePostReportRequest,
  PostCommentResponse,
  PostReportResponse,
  PostResponse,
  RecordPostViewRequest,
  UpdatePostRequest,
} from "./types";
import type {
  CursorPaginationInput,
  FeedPostPageResponseDto,
  ListPostCommentsResponseDto,
  ListPostsResponseDto,
  RecordPostViewResponseDto,
  TogglePostLikeResponseDto,
} from "../../shared/types/content";

export const listMyFeedPosts = api(
  { method: "GET", path: "/me/feed", expose: true, auth: true },
  async ({
    cursor,
    limit,
  }: CursorPaginationInput): Promise<FeedPostPageResponseDto> => {
    const walletAddress = getRequiredWallet();
    return service.listMyFeedPosts(walletAddress, { cursor, limit });
  },
);

interface ListExploreFeedRequest extends CursorPaginationInput {
  authorization?: Header<"Authorization">;
  q?: string;
  source?: "all" | "public" | "subscribed" | "promoted";
}

export const listExploreFeedPosts = api(
  { method: "GET", path: "/feed", expose: true },
  async ({
    authorization,
    cursor,
    limit,
    q,
    source,
  }: ListExploreFeedRequest): Promise<FeedPostPageResponseDto> => {
    const viewerWallet = await getOptionalViewerWallet(authorization);
    return service.listExploreFeedPosts(viewerWallet, { cursor, limit, q, source });
  },
);

export const createMyPost = api(
  { method: "POST", path: "/me/posts", expose: true, auth: true },
  async (req: CreatePostRequest): Promise<PostResponse> => {
    const walletAddress = getRequiredWallet();
    const post = await service.createMyPost(walletAddress, req);
    return service.buildPostResponse(post, walletAddress);
  },
);

interface ListMyPostsRequest {
  status?: "draft" | "published" | "archived";
}

export const listMyPosts = api(
  { method: "GET", path: "/me/posts", expose: true, auth: true },
  async ({
    status,
  }: ListMyPostsRequest): Promise<ListPostsResponseDto> => {
    const walletAddress = getRequiredWallet();
    const posts =
      status === "archived"
        ? await service.listMyArchivedPosts(walletAddress)
        : await service.listMyPosts(walletAddress);
    return {
      posts: await Promise.all(
        posts.map((post) =>
          service.buildPostResponse(post, walletAddress),
        ),
      ),
    };
  },
);

export const updateMyPost = api(
  { method: "PATCH", path: "/me/posts/:postId", expose: true, auth: true },
  async ({
    postId,
    ...req
  }: UpdatePostRequest & { postId: string }): Promise<PostResponse> => {
    const walletAddress = getRequiredWallet();
    const post = await service.updateMyPost(walletAddress, postId, req);
    return service.buildPostResponse(post, walletAddress);
  },
);

export const deleteMyPost = api(
  { method: "DELETE", path: "/me/posts/:postId", expose: true, auth: true },
  async ({ postId }: { postId: string }): Promise<void> => {
    const walletAddress = getRequiredWallet();
    await service.deleteMyPost(walletAddress, postId);
  },
);

export const promoteMyPost = api(
  {
    method: "POST",
    path: "/me/posts/:postId/promotion",
    expose: true,
    auth: true,
  },
  async ({ postId }: { postId: string }): Promise<PostResponse> => {
    const walletAddress = getRequiredWallet();
    const post = await service.promoteMyPost(walletAddress, postId);
    return service.buildPostResponse(post, walletAddress);
  },
);

export const stopPromotingMyPost = api(
  {
    method: "DELETE",
    path: "/me/posts/:postId/promotion",
    expose: true,
    auth: true,
  },
  async ({ postId }: { postId: string }): Promise<PostResponse> => {
    const walletAddress = getRequiredWallet();
    const post = await service.stopPromotingMyPost(walletAddress, postId);
    return service.buildPostResponse(post, walletAddress);
  },
);

interface ListAuthorPostsRequest {
  slug: string;
  cursor?: string;
  limit?: number;
  authorization?: Header<"Authorization">;
}

export const listAuthorPosts = api(
  { method: "GET", path: "/authors/:slug/posts", expose: true },
  async ({
    slug,
    authorization,
    cursor,
    limit,
  }: ListAuthorPostsRequest): Promise<FeedPostPageResponseDto> => {
    const viewerWallet = await getOptionalViewerWallet(authorization);
    return service.listAuthorPostsBySlug(slug, viewerWallet, { cursor, limit });
  },
);

interface GetAuthorPostRequest {
  slug: string;
  postId: string;
  authorization?: Header<"Authorization">;
}

export const getAuthorPost = api(
  { method: "GET", path: "/authors/:slug/posts/:postId", expose: true },
  async ({
    slug,
    postId,
    authorization,
  }: GetAuthorPostRequest): Promise<PostResponse> => {
    const viewerWallet = await getOptionalViewerWallet(authorization);
    const post = await service.getAuthorPostBySlugAndId(
      slug,
      postId,
      viewerWallet,
    );
    return service.buildPostResponse(post, viewerWallet);
  },
);

export const listPostComments = api(
  {
    method: "GET",
    path: "/authors/:slug/posts/:postId/comments",
    expose: true,
  },
  async ({
    slug,
    postId,
    authorization,
  }: GetAuthorPostRequest): Promise<ListPostCommentsResponseDto> => {
    const viewerWallet = await getOptionalViewerWallet(authorization);
    const comments = await service.listPostCommentsBySlug(
      slug,
      postId,
      viewerWallet,
    );
    return { comments: comments.map(service.toPostCommentResponse) };
  },
);

export const createPostComment = api(
  {
    method: "POST",
    path: "/authors/:slug/posts/:postId/comments",
    expose: true,
    auth: true,
  },
  async ({
    slug,
    postId,
    ...req
  }: CreatePostCommentRequest & {
    slug: string;
    postId: string;
  }): Promise<PostCommentResponse> => {
    const walletAddress = getRequiredWallet();
    const comment = await service.createPostCommentBySlug(
      slug,
      postId,
      walletAddress,
      req,
    );
    return service.toPostCommentResponse(comment);
  },
);

export const createPostReport = api(
  {
    method: "POST",
    path: "/authors/:slug/posts/:postId/report",
    expose: true,
    auth: true,
  },
  async ({
    slug,
    postId,
    ...req
  }: CreatePostReportRequest & {
    slug: string;
    postId: string;
  }): Promise<PostReportResponse> => {
    const walletAddress = getRequiredWallet();
    const report = await service.createPostReportBySlug(
      slug,
      postId,
      walletAddress,
      req,
    );
    return service.toPostReportResponse(report);
  },
);

export const togglePostLike = api(
  {
    method: "POST",
    path: "/authors/:slug/posts/:postId/like",
    expose: true,
    auth: true,
  },
  async ({
    slug,
    postId,
  }: {
    slug: string;
    postId: string;
  }): Promise<TogglePostLikeResponseDto> => {
    const walletAddress = getRequiredWallet();
    return service.togglePostLikeBySlug(slug, postId, walletAddress);
  },
);

export const recordPostView = api(
  {
    method: "POST",
    path: "/authors/:slug/posts/:postId/view",
    expose: true,
  },
  async ({
    slug,
    postId,
    authorization,
    ...req
  }: RecordPostViewRequest & {
    slug: string;
    postId: string;
    authorization?: Header<"Authorization">;
  }): Promise<RecordPostViewResponseDto> => {
    const viewerWallet = await getOptionalViewerWallet(authorization);
    return service.recordPostViewBySlug(
      slug,
      postId,
      req.viewerKey,
      viewerWallet,
    );
  },
);

export const uploadMyPostAttachment = api.raw(
  {
    method: "POST",
    path: "/me/post-files/upload/*postId",
    expose: true,
    auth: true,
  },
  async (req, resp) => {
    const walletAddress = getRequiredWallet();
    const url = new URL(req.url ?? "", "http://localhost");
    const postId = url.pathname.replace("/me/post-files/upload/", "");
    const name = url.searchParams.get("name") ?? "";
    const body = await readRequestBody(req);
    const contentType = String(
      req.headers["content-type"] ?? "application/octet-stream",
    );
    const attachment = await service.uploadMyPostAttachment(
      walletAddress,
      postId,
      { name, body, contentType },
    );

    resp.writeHead(200, { "Content-Type": "application/json" });
    resp.end(JSON.stringify(service.toPostAttachmentResponse(attachment)));
  },
);

export const downloadMyPostAttachment = api.raw(
  {
    method: "GET",
    path: "/me/post-files/download/*path",
    expose: true,
    auth: true,
  },
  async (req, resp) => {
    const walletAddress = getRequiredWallet();
    const [postId, attachmentId] = parseFilePath(
      req.url ?? "",
      "/me/post-files/download/",
    );
    const file = await service.getMyPostAttachment(
      walletAddress,
      postId,
      attachmentId,
    );
    writeFileResponse(resp, file);
  },
);

export const downloadAuthorPostAttachment = api.raw(
  {
    method: "GET",
    path: "/post-files/download/*path",
    expose: true,
  },
  async (req, resp) => {
    const [slug, postId, attachmentId] = parseFilePath(
      req.url ?? "",
      "/post-files/download/",
    );
    const viewerWallet = await getOptionalViewerWallet(
      String(req.headers.authorization ?? ""),
    );
    const file = await service.getAuthorPostAttachmentBySlug(
      slug,
      postId,
      attachmentId,
      viewerWallet,
    );
    writeFileResponse(resp, file);
  },
);
