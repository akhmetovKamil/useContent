import type { Header } from "encore.dev/api";
import type { CursorPaginationInput } from "../../shared/types/content";
import type {
  CreatePostCommentRequest,
  CreatePostReportRequest,
  RecordPostViewRequest,
  UpdatePostRequest,
} from "../lib/content-types";

export * from "../lib/content-types";

export interface DeletePostRequest {
  postId: string;
}

export interface GetAuthorPostRequest {
  slug: string;
  postId: string;
  authorization?: Header<"Authorization">;
}

export interface ListAuthorPostsRequest extends CursorPaginationInput {
  slug: string;
  authorization?: Header<"Authorization">;
}

export interface ListExploreFeedRequest extends CursorPaginationInput {
  authorization?: Header<"Authorization">;
  q?: string;
  source?: "all" | "public" | "subscribed" | "promoted";
}

export type MyFeedPostsRequest = CursorPaginationInput;

export interface ListMyPostsRequest {
  status?: "draft" | "published" | "archived";
}

export type CreatePostCommentPathRequest = CreatePostCommentRequest &
  Pick<GetAuthorPostRequest, "slug" | "postId">;

export type CreatePostReportPathRequest = CreatePostReportRequest &
  Pick<GetAuthorPostRequest, "slug" | "postId">;

export type RecordPostViewPathRequest = RecordPostViewRequest &
  GetAuthorPostRequest;

export type TogglePostLikeRequest = Pick<GetAuthorPostRequest, "slug" | "postId">;

export type UpdatePostPathRequest = UpdatePostRequest & DeletePostRequest;
