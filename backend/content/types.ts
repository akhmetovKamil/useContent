import type { ObjectId } from "mongodb";
import type { AccessPolicy, PolicyMode } from "../domain/access";
import type {
  AuthorProfileDto,
  CreateAuthorProfileInput,
  CreatePostInput,
  CreateProjectInput,
  CreateProjectFolderInput,
  PostDto,
  ProjectDto,
  ProjectNodeDto,
  SubscriptionEntitlementDto,
  SubscriptionPlanDto,
  UpdateAuthorProfileInput,
  UpdateMyProfileInput,
  UpdatePostInput,
  UpdateProjectInput,
  UpdateProjectNodeInput,
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
  avatarFileId: ObjectId | null;
  defaultPolicy: AccessPolicy;
  subscriptionPlanId: ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PostDoc {
  _id: ObjectId;
  authorId: ObjectId;
  title: string;
  content: string;
  status: "draft" | "published";
  policyMode: PolicyMode;
  policy: AccessPolicy | null;
  attachmentIds: ObjectId[];
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectDoc {
  _id: ObjectId;
  authorId: ObjectId;
  title: string;
  description: string;
  status: "draft" | "published";
  policyMode: PolicyMode;
  policy: AccessPolicy | null;
  rootNodeId: ObjectId;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
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
  chainId: number;
  tokenAddress: string;
  price: string;
  billingPeriodDays: number;
  contractAddress: string;
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

export type UserProfileResponse = UserProfileDto;
export type AuthorProfileResponse = AuthorProfileDto;
export type SubscriptionEntitlementResponse = SubscriptionEntitlementDto;
export type SubscriptionPlanResponse = SubscriptionPlanDto;
export type PostResponse = PostDto;
export type ProjectResponse = ProjectDto;
export type ProjectNodeResponse = ProjectNodeDto;
export type UpdateMyProfileRequest = UpdateMyProfileInput;
export type CreateAuthorProfileRequest = CreateAuthorProfileInput;
export type UpdateAuthorProfileRequest = UpdateAuthorProfileInput;
export type UpsertSubscriptionPlanRequest = UpsertSubscriptionPlanInput;
export type CreatePostRequest = CreatePostInput;
export type UpdatePostRequest = UpdatePostInput;
export type CreateProjectRequest = CreateProjectInput;
export type UpdateProjectRequest = UpdateProjectInput;
export type CreateProjectFolderRequest = CreateProjectFolderInput;
export type UpdateProjectNodeRequest = UpdateProjectNodeInput;
