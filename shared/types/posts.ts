import type { AccessPolicy, AccessPolicyInput, PolicyMode } from "./access";
import type {
  ActivityType,
  ContentStatus,
  FeedSource,
  PostAttachmentKind,
  PostReportReason,
  PostReportStatus,
} from "../consts";
import type {
  AuthorOwnedDto,
  ContentBaseDto,
  EntityId,
  Maybe,
  NullableDateString,
  StorageSizedDto,
  WalletAddress,
} from "./common";
export type {
  ActivityType,
  ContentStatus,
  FeedSource,
  PostAttachmentKind,
  PostReportReason,
  PostReportStatus,
} from "../consts";

export interface PostCommentDto extends AuthorOwnedDto {
  id: EntityId;
  postId: EntityId;
  walletAddress: WalletAddress;
  displayName: string;
  avatarFileId: Maybe<EntityId>;
  isAuthorComment: boolean;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityDto {
  id: EntityId;
  type: ActivityType;
  targetWallet: WalletAddress;
  actorWallet: Maybe<WalletAddress>;
  authorId: Maybe<EntityId>;
  authorSlug: Maybe<string>;
  authorDisplayName: Maybe<string>;
  postId: Maybe<EntityId>;
  postTitle: Maybe<string>;
  message: string;
  createdAt: string;
  readAt: NullableDateString;
}

export interface PostReportDto extends AuthorOwnedDto {
  id: EntityId;
  postId: EntityId;
  reporterWallet: WalletAddress;
  reason: PostReportReason;
  comment: Maybe<string>;
  status: PostReportStatus;
  createdAt: string;
  updatedAt: string;
}

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

export type PostMediaLayout = "carousel" | "resizable_grid";

export interface PostMediaGridLayoutDto {
  variant: "two" | "three" | "four";
  sizes: number[];
}

export interface PostDto extends ContentBaseDto {
  content: string;
  status: ContentStatus;
  policyMode: PolicyMode;
  policy: Maybe<AccessPolicy>;
  accessPolicyId: Maybe<EntityId>;
  mediaLayout: PostMediaLayout;
  mediaGridLayout: Maybe<PostMediaGridLayoutDto>;
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
  authorAvatarFileId: Maybe<EntityId>;
  accessLabel: Maybe<string>;
  hasAccess: boolean;
  feedSource: FeedSource;
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
  mediaLayout?: PostMediaLayout;
  mediaGridLayout?: Maybe<PostMediaGridLayoutDto>;
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
