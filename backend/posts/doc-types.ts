import type { ObjectId } from "mongodb";
import type {
  ContentStatus,
  PostAttachmentKind,
  PostPromotionStatus,
  PostReportReason,
  PostReportStatus,
} from "../../shared/consts";
import type { AccessPolicy, PolicyMode } from "../domain/access";

export interface PostDoc {
  _id: ObjectId;
  authorId: ObjectId;
  title: string;
  content: string;
  status: ContentStatus;
  policyMode: PolicyMode;
  policy: AccessPolicy | null;
  accessPolicyId: ObjectId | null;
  mediaLayout?: "carousel" | "resizable_grid";
  mediaGridLayout?: PostMediaGridLayoutDoc | null;
  attachmentIds: ObjectId[];
  linkedProjectIds: ObjectId[];
  promoted?: boolean;
  promotedAt?: Date | null;
  promotionStatus?: PostPromotionStatus | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PostMediaGridLayoutDoc {
  variant: "two" | "three" | "four";
  sizes: number[];
}

export interface PostLikeDoc {
  _id: ObjectId;
  postId: ObjectId;
  authorId: ObjectId;
  walletAddress: string;
  createdAt: Date;
}

export interface PostCommentDoc {
  _id: ObjectId;
  postId: ObjectId;
  authorId: ObjectId;
  walletAddress: string;
  displayName: string;
  avatarFileId?: ObjectId | null;
  isAuthorComment?: boolean;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PostReportDoc {
  _id: ObjectId;
  postId: ObjectId;
  authorId: ObjectId;
  reporterWallet: string;
  reason: PostReportReason;
  comment: string | null;
  status: PostReportStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface PostAttachmentDoc {
  _id: ObjectId;
  postId: ObjectId;
  authorId: ObjectId;
  kind: PostAttachmentKind;
  fileName: string;
  storageKey: string;
  mimeType: string;
  size: number;
  createdAt: Date;
}

export interface PostViewDoc {
  _id: ObjectId;
  postId: ObjectId;
  viewerKey: string;
  createdAt: Date;
  updatedAt: Date;
}
