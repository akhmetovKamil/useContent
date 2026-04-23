import type { AccessPolicy, AccessPolicyInput } from "./access";
import type { BaseEntityDto, EntityId, Maybe, WalletAddress } from "./common";

export interface UserWalletDto {
  address: WalletAddress;
  kind: "primary" | "secondary";
  addedAt: string;
}

export interface UserProfileDto extends BaseEntityDto {
  username: Maybe<string>;
  displayName: string;
  bio: string;
  avatarFileId: Maybe<EntityId>;
  primaryWallet: WalletAddress;
  wallets: UserWalletDto[];
  role: "user" | "admin";
}

export interface AuthorProfileDto extends BaseEntityDto {
  userId: EntityId;
  slug: string;
  displayName: string;
  bio: string;
  tags: string[];
  avatarFileId: Maybe<EntityId>;
  defaultPolicy: AccessPolicy;
  defaultPolicyId: Maybe<EntityId>;
  subscriptionPlanId: Maybe<EntityId>;
}

export interface AuthorCatalogItemDto extends AuthorProfileDto {
  postsCount: number;
  subscriptionPlansCount: number;
}

export interface AuthorStorageUsageDto {
  authorId: EntityId;
  postsBytes: number;
  projectsBytes: number;
  totalUsedBytes: number;
}

export interface UpdateMyProfileInput {
  username?: Maybe<string>;
  displayName?: string;
  bio?: string;
}

export interface CreateAuthorProfileInput {
  slug: string;
  displayName: string;
  bio?: string;
  tags?: string[];
  defaultPolicy?: AccessPolicy;
  defaultPolicyInput?: AccessPolicyInput;
}

export interface UpdateAuthorProfileInput {
  displayName?: string;
  bio?: string;
  tags?: string[];
  defaultPolicy?: AccessPolicy;
  defaultPolicyInput?: AccessPolicyInput;
  defaultPolicyId?: Maybe<EntityId>;
}
