import type { AccessPolicy, PolicyMode } from "./access";

export interface AccessPolicyInputPublicNode {
  type: "public";
}

export interface AccessPolicyInputSubscriptionNode {
  type: "subscription";
  planCode?: string;
}

export interface AccessPolicyInputTokenBalanceNode {
  type: "token_balance";
  chainId: number;
  contractAddress: string;
  minAmount: string;
  decimals: number;
}

export interface AccessPolicyInputNftOwnershipNode {
  type: "nft_ownership";
  chainId: number;
  contractAddress: string;
  standard: "erc721" | "erc1155";
  tokenId?: string;
  minBalance?: string;
}

export interface AccessPolicyInputOrNode {
  type: "or";
  children: AccessPolicyInputNode[];
}

export interface AccessPolicyInputAndNode {
  type: "and";
  children: AccessPolicyInputNode[];
}

export type AccessPolicyInputNode =
  | AccessPolicyInputPublicNode
  | AccessPolicyInputSubscriptionNode
  | AccessPolicyInputTokenBalanceNode
  | AccessPolicyInputNftOwnershipNode
  | AccessPolicyInputOrNode
  | AccessPolicyInputAndNode;

export interface AccessPolicyInput {
  root: AccessPolicyInputNode;
}

export interface UserWalletDto {
  address: string;
  kind: "primary" | "secondary";
  addedAt: string;
}

export interface UserProfileDto {
  id: string;
  username: string | null;
  displayName: string;
  bio: string;
  avatarFileId: string | null;
  primaryWallet: string;
  wallets: UserWalletDto[];
  role: "user" | "admin";
  createdAt: string;
  updatedAt: string;
}

export interface AuthorProfileDto {
  id: string;
  userId: string;
  slug: string;
  displayName: string;
  bio: string;
  tags: string[];
  avatarFileId: string | null;
  defaultPolicy: AccessPolicy;
  defaultPolicyId: string | null;
  subscriptionPlanId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthorCatalogItemDto extends AuthorProfileDto {
  postsCount: number;
  subscriptionPlansCount: number;
}

export interface AccessPolicyPresetDto {
  id: string;
  authorId: string;
  name: string;
  description: string;
  policy: AccessPolicy;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthorAccessPolicyDto extends AccessPolicyPresetDto {
  accessLabel: string | null;
  hasAccess: boolean;
}

export interface SubscriptionEntitlementDto {
  id: string;
  authorId: string;
  subscriberWallet: string;
  planId: string;
  status: "active" | "expired";
  validUntil: string;
  source: "onchain";
  createdAt: string;
  updatedAt: string;
}

export interface ReaderSubscriptionDto extends SubscriptionEntitlementDto {
  authorSlug: string;
  authorDisplayName: string;
  planCode: string | null;
  planTitle: string | null;
}

export interface AuthorSubscriberDto {
  id: string;
  subscriberWallet: string;
  subscriberDisplayName: string | null;
  subscriberUsername: string | null;
  planId: string;
  planCode: string | null;
  planTitle: string | null;
  accessPolicyNames: string[];
  status: "active" | "expired";
  validUntil: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeedPostDto extends PostDto {
  authorSlug: string;
  authorDisplayName: string;
  accessLabel: string | null;
  hasAccess: boolean;
}

export interface FeedProjectDto extends ProjectDto {
  authorSlug: string;
  authorDisplayName: string;
  accessLabel: string | null;
  hasAccess: boolean;
}

export type SubscriptionPaymentAsset = "erc20" | "native";

export interface SubscriptionPaymentIntentDto {
  id: string;
  authorId: string;
  subscriberWallet: string;
  planId: string;
  planCode: string;
  planKey: string;
  paymentAsset: SubscriptionPaymentAsset;
  chainId: number;
  tokenAddress: string;
  contractAddress: string;
  price: string;
  billingPeriodDays: number;
  status: "pending" | "submitted" | "confirmed" | "expired" | "cancelled";
  txHash: string | null;
  entitlementId: string | null;
  paidUntil: string | null;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionPlanDto {
  id: string;
  authorId: string;
  code: string;
  title: string;
  paymentAsset: SubscriptionPaymentAsset;
  chainId: number;
  tokenAddress: string;
  price: string;
  billingPeriodDays: number;
  contractAddress: string;
  planKey: string;
  registrationTxHash: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ContractDeploymentDto {
  id: string;
  chainId: number;
  contractName: "SubscriptionManager";
  address: string;
  platformTreasury: string;
  deployedBy: string;
  deploymentTxHash: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContractDeploymentLookupDto {
  deployment: ContractDeploymentDto | null;
}

export interface PostDto {
  id: string;
  authorId: string;
  title: string;
  content: string;
  status: "draft" | "published";
  policyMode: PolicyMode;
  policy: AccessPolicy | null;
  accessPolicyId: string | null;
  attachmentIds: string[];
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDto {
  id: string;
  authorId: string;
  title: string;
  description: string;
  status: "draft" | "published";
  policyMode: PolicyMode;
  policy: AccessPolicy | null;
  accessPolicyId: string | null;
  rootNodeId: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectNodeDto {
  id: string;
  authorId: string;
  projectId: string;
  parentId: string | null;
  kind: "file" | "folder";
  name: string;
  storageKey: string | null;
  mimeType: string | null;
  size: number | null;
  visibility: "author" | "published";
  createdAt: string;
  updatedAt: string;
}

export interface ProjectNodeListDto {
  nodes: ProjectNodeDto[];
  currentFolderId: string;
  breadcrumbs: ProjectNodeDto[];
}

export interface UpdateMyProfileInput {
  username?: string | null;
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
  defaultPolicyId?: string | null;
}

export interface UpsertSubscriptionPlanInput {
  code?: string;
  title: string;
  paymentAsset?: SubscriptionPaymentAsset;
  chainId: number;
  tokenAddress: string;
  price: string;
  billingPeriodDays: number;
  contractAddress: string;
  planKey?: string;
  registrationTxHash?: string | null;
  active?: boolean;
}

export interface CreateAccessPolicyPresetInput {
  name: string;
  description?: string;
  policy?: AccessPolicy;
  policyInput?: AccessPolicyInput;
  isDefault?: boolean;
}

export interface UpdateAccessPolicyPresetInput {
  name?: string;
  description?: string;
  policy?: AccessPolicy;
  policyInput?: AccessPolicyInput;
  isDefault?: boolean;
}

export interface CreateSubscriptionPaymentIntentInput {
  planCode?: string;
}

export interface ConfirmSubscriptionPaymentInput {
  txHash: string;
}

export interface UpsertContractDeploymentInput {
  chainId: number;
  contractName: "SubscriptionManager";
  address: string;
  platformTreasury: string;
  deployedBy: string;
  deploymentTxHash?: string | null;
}

export interface CreatePostInput {
  title: string;
  content: string;
  status?: "draft" | "published";
  policyMode?: PolicyMode;
  policy?: AccessPolicy | null;
  policyInput?: AccessPolicyInput;
  accessPolicyId?: string | null;
  attachmentIds?: string[];
}

export interface UpdatePostInput {
  title?: string;
  content?: string;
  status?: "draft" | "published";
  policyMode?: PolicyMode;
  policy?: AccessPolicy | null;
  policyInput?: AccessPolicyInput;
  accessPolicyId?: string | null;
  attachmentIds?: string[];
}

export interface CreateProjectInput {
  title: string;
  description?: string;
  status?: "draft" | "published";
  policyMode?: PolicyMode;
  policy?: AccessPolicy | null;
  policyInput?: AccessPolicyInput;
  accessPolicyId?: string | null;
}

export interface UpdateProjectInput {
  title?: string;
  description?: string;
  status?: "draft" | "published";
  policyMode?: PolicyMode;
  policy?: AccessPolicy | null;
  policyInput?: AccessPolicyInput;
  accessPolicyId?: string | null;
}

export interface CreateProjectFolderInput {
  name: string;
  parentId?: string | null;
  visibility?: "author" | "published";
}

export interface UpdateProjectNodeInput {
  name?: string;
  parentId?: string | null;
  visibility?: "author" | "published";
}
