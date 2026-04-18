import type { ObjectId } from "mongodb";
import type { AccessPolicy, PolicyMode } from "../domain/access";
import type {
  AccessPolicyPresetDto,
  AuthorAccessPolicyDto,
  AuthorCatalogItemDto,
  AuthorSubscriberDto,
  AuthorProfileDto,
  ConfirmSubscriptionPaymentInput,
  ContentStatus,
  ContractDeploymentDto,
  ContractDeploymentLookupDto,
  CreateAccessPolicyPresetInput,
  CreateAuthorProfileInput,
  CreatePostInput,
  CreateProjectInput,
  CreateProjectFolderInput,
  CreateSubscriptionPaymentIntentInput,
  FeedPostDto,
  FeedProjectDto,
  PostDto,
  PostCommentDto,
  PostAttachmentDto,
  PostAttachmentKind,
  CreatePostCommentInput,
  ProjectDto,
  ProjectNodeListDto,
  ProjectNodeDto,
  ReaderSubscriptionDto,
  SubscriptionEntitlementDto,
  SubscriptionPaymentIntentDto,
  SubscriptionPlanDto,
  UpdateAuthorProfileInput,
  UpdateAccessPolicyPresetInput,
  UpdateMyProfileInput,
  UpdatePostInput,
  UpdateProjectInput,
  UpdateProjectNodeInput,
  UpsertContractDeploymentInput,
  UpsertSubscriptionPlanInput,
  UserProfileDto,
} from "../../contracts/types/content";

export interface UserWalletDoc {
  address: string;
  kind: "primary" | "secondary";
  addedAt: Date;
}

export interface UserDoc {
  _id: ObjectId;
  username: string | null;
  displayName: string;
  bio: string;
  avatarFileId: ObjectId | null;
  primaryWallet: string;
  wallets: UserWalletDoc[];
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthorProfileDoc {
  _id: ObjectId;
  userId: string;
  slug: string;
  displayName: string;
  bio: string;
  tags: string[];
  avatarFileId: ObjectId | null;
  defaultPolicy: AccessPolicy;
  defaultPolicyId: ObjectId | null;
  subscriptionPlanId: ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccessPolicyPresetDoc {
  _id: ObjectId;
  authorId: ObjectId;
  name: string;
  description: string;
  policy: AccessPolicy;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PostDoc {
  _id: ObjectId;
  authorId: ObjectId;
  title: string;
  content: string;
  status: ContentStatus;
  policyMode: PolicyMode;
  policy: AccessPolicy | null;
  accessPolicyId: ObjectId | null;
  attachmentIds: ObjectId[];
  linkedProjectIds: ObjectId[];
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectDoc {
  _id: ObjectId;
  authorId: ObjectId;
  title: string;
  description: string;
  status: ContentStatus;
  policyMode: PolicyMode;
  policy: AccessPolicy | null;
  accessPolicyId: ObjectId | null;
  rootNodeId: ObjectId;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
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
  content: string;
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

export interface ProjectNodeDoc {
  _id: ObjectId;
  authorId: ObjectId;
  projectId: ObjectId;
  parentId: ObjectId | null;
  kind: "file" | "folder";
  name: string;
  storageKey: string | null;
  mimeType: string | null;
  size: number | null;
  visibility: "author" | "published";
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionPlanDoc {
  _id: ObjectId;
  authorId: ObjectId;
  code: string;
  title: string;
  paymentAsset: "erc20" | "native";
  chainId: number;
  tokenAddress: string;
  price: string;
  billingPeriodDays: number;
  contractAddress: string;
  planKey: string;
  registrationTxHash: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionEntitlementDoc {
  _id: ObjectId;
  authorId: ObjectId;
  subscriberWallet: string;
  planId: ObjectId;
  status: "active" | "expired";
  validUntil: Date;
  source: "onchain";
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionPaymentIntentDoc {
  _id: ObjectId;
  authorId: ObjectId;
  subscriberWallet: string;
  planId: ObjectId;
  planCode: string;
  planKey: string;
  paymentAsset: "erc20" | "native";
  chainId: number;
  tokenAddress: string;
  contractAddress: string;
  price: string;
  billingPeriodDays: number;
  status: "pending" | "submitted" | "confirmed" | "expired" | "cancelled";
  txHash: string | null;
  entitlementId: ObjectId | null;
  paidUntil: Date | null;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContractDeploymentDoc {
  _id: ObjectId;
  chainId: number;
  contractName: "SubscriptionManager";
  address: string;
  platformTreasury: string;
  deployedBy: string;
  deploymentTxHash: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type UserProfileResponse = UserProfileDto;
export type AuthorProfileResponse = AuthorProfileDto;
export type AuthorCatalogItemResponse = AuthorCatalogItemDto;
export type AuthorAccessPolicyResponse = AuthorAccessPolicyDto;
export type AuthorSubscriberResponse = AuthorSubscriberDto;
export type AccessPolicyPresetResponse = AccessPolicyPresetDto;
export type SubscriptionEntitlementResponse = SubscriptionEntitlementDto;
export type ReaderSubscriptionResponse = ReaderSubscriptionDto;
export type FeedPostResponse = FeedPostDto;
export type PostCommentResponse = PostCommentDto;
export type PostAttachmentResponse = PostAttachmentDto;
export type FeedProjectResponse = FeedProjectDto;
export type ContractDeploymentResponse = ContractDeploymentDto;
export type ContractDeploymentLookupResponse = ContractDeploymentLookupDto;
export type SubscriptionPaymentIntentResponse = SubscriptionPaymentIntentDto;
export type SubscriptionPlanResponse = SubscriptionPlanDto;
export type PostResponse = PostDto;
export type ProjectResponse = ProjectDto;
export type ProjectNodeResponse = ProjectNodeDto;
export type ProjectNodeListResponse = ProjectNodeListDto;
export type UpdateMyProfileRequest = UpdateMyProfileInput;
export type CreateAccessPolicyPresetRequest = CreateAccessPolicyPresetInput;
export type UpdateAccessPolicyPresetRequest = UpdateAccessPolicyPresetInput;
export type CreateAuthorProfileRequest = CreateAuthorProfileInput;
export type UpdateAuthorProfileRequest = UpdateAuthorProfileInput;
export type UpsertSubscriptionPlanRequest = UpsertSubscriptionPlanInput;
export type CreatePostRequest = CreatePostInput;
export type UpdatePostRequest = UpdatePostInput;
export type CreatePostCommentRequest = CreatePostCommentInput;
export type CreateProjectRequest = CreateProjectInput;
export type UpdateProjectRequest = UpdateProjectInput;
export type CreateProjectFolderRequest = CreateProjectFolderInput;
export type UpdateProjectNodeRequest = UpdateProjectNodeInput;
export type CreateSubscriptionPaymentIntentRequest =
  CreateSubscriptionPaymentIntentInput;
export type ConfirmSubscriptionPaymentRequest = ConfirmSubscriptionPaymentInput;
export type UpsertContractDeploymentRequest = UpsertContractDeploymentInput;
