import type { AccessPolicy, AccessPolicyInput, PolicyMode } from "./access";
import type {
  AuthorOwnedDto,
  ContentBaseDto,
  EntityId,
  Maybe,
  NullableDateString,
  StorageSizedDto,
  WalletAddress,
} from "./common";

export type ContentStatus = "draft" | "published" | "archived";

export interface PostCommentDto extends AuthorOwnedDto {
  id: EntityId;
  postId: EntityId;
  walletAddress: WalletAddress;
  displayName: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export type PostReportReason = "spam" | "scam" | "illegal_content" | "abuse" | "other";

export interface PostReportDto extends AuthorOwnedDto {
  id: EntityId;
  postId: EntityId;
  reporterWallet: WalletAddress;
  reason: PostReportReason;
  comment: Maybe<string>;
  status: "open" | "reviewed" | "dismissed";
  createdAt: string;
  updatedAt: string;
}

export type PostAttachmentKind = "image" | "video" | "audio" | "file";

export interface PostAttachmentDto extends AuthorOwnedDto, StorageSizedDto {
  id: EntityId;
  postId: EntityId;
  kind: PostAttachmentKind;
  fileName: string;
  mimeType: string;
  createdAt: string;
}

export interface PostPromotionDto {
  active: boolean;
  promotedAt: NullableDateString;
}

export interface PostDto extends ContentBaseDto {
  content: string;
  status: ContentStatus;
  policyMode: PolicyMode;
  policy: Maybe<AccessPolicy>;
  accessPolicyId: Maybe<EntityId>;
  attachmentIds: EntityId[];
  attachments: PostAttachmentDto[];
  linkedProjectIds: EntityId[];
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
  likedByMe: boolean;
  promotion: Maybe<PostPromotionDto>;
}

export interface FeedPostDto extends PostDto {
  authorSlug: string;
  authorDisplayName: string;
  accessLabel: Maybe<string>;
  hasAccess: boolean;
  feedSource: "public" | "subscribed" | "promoted" | "author";
  feedReason: Maybe<string>;
  commentsPreview: PostCommentDto[];
}

export interface RecordPostViewInput {
  viewerKey: string;
}

export interface CreatePostInput {
  title: string;
  content: string;
  status?: ContentStatus;
  policyMode?: PolicyMode;
  policy?: Maybe<AccessPolicy>;
  policyInput?: AccessPolicyInput;
  accessPolicyId?: Maybe<EntityId>;
  attachmentIds?: EntityId[];
  linkedProjectIds?: EntityId[];
}

export type UpdatePostInput = Partial<CreatePostInput>;

export interface CreatePostCommentInput {
  content: string;
}

export interface CreatePostReportInput {
  reason: PostReportReason;
  comment?: Maybe<string>;
}
