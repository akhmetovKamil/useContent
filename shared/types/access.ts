import type {
  AccessConditionMode,
  NftStandard,
} from "../consts";
import type {
  AuthorOwnedDto,
  BaseEntityDto,
  ChainId,
  Maybe,
  NullableDateString,
} from "./common";
import type { SubscriptionPlanDto } from "./subscriptions";

export const ACCESS_POLICY_VERSION = 1;
export type { AccessConditionMode, NftStandard, PolicyMode } from "../consts";

export interface PublicPolicyNode {
  type: "public";
}

export interface SubscriptionPolicyNode {
  type: "subscription";
  authorId: string;
  planId: string;
}

export interface TokenBalancePolicyNode {
  type: "token_balance";
  chainId: ChainId;
  contractAddress: string;
  minAmount: string;
  decimals: number;
}

export interface NftOwnershipPolicyNode {
  type: "nft_ownership";
  chainId: ChainId;
  contractAddress: string;
  standard: NftStandard;
  tokenId?: string;
  minBalance?: string;
}

export interface OrPolicyNode {
  type: "or";
  children: AccessPolicyNode[];
}

export interface AndPolicyNode {
  type: "and";
  children: AccessPolicyNode[];
}

export type AccessPolicyNode =
  | PublicPolicyNode
  | SubscriptionPolicyNode
  | TokenBalancePolicyNode
  | NftOwnershipPolicyNode
  | OrPolicyNode
  | AndPolicyNode;

export interface AccessPolicy {
  version: typeof ACCESS_POLICY_VERSION;
  root: AccessPolicyNode;
}

export interface AccessPolicyInputPublicNode {
  type: "public";
}

export interface AccessPolicyInputSubscriptionNode {
  type: "subscription";
  planCode?: string;
}

export interface AccessPolicyInputTokenBalanceNode {
  type: "token_balance";
  chainId: ChainId;
  contractAddress: string;
  minAmount: string;
  decimals: number;
}

export interface AccessPolicyInputNftOwnershipNode {
  type: "nft_ownership";
  chainId: ChainId;
  contractAddress: string;
  standard: NftStandard;
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

export interface AccessPolicyPresetDto extends BaseEntityDto, AuthorOwnedDto {
  name: string;
  description: string;
  policy: AccessPolicy;
  isDefault: boolean;
  postsCount: number;
  projectsCount: number;
  paidSubscribersCount: number;
}

export interface AuthorAccessPolicyDto extends AccessPolicyPresetDto {
  accessLabel: Maybe<string>;
  hasAccess: boolean;
  paidSubscribersCount: number;
  conditionMode: AccessConditionMode;
  conditions: AccessPolicyConditionDto[];
}

export interface SubscriptionAccessConditionDto {
  type: "subscription";
  plan: SubscriptionPlanDto;
  satisfied: boolean;
  validUntil: NullableDateString;
}

export interface TokenBalanceAccessConditionDto {
  type: "token_balance";
  chainId: ChainId;
  contractAddress: string;
  minAmount: string;
  decimals: number;
  satisfied: boolean;
  currentBalance: Maybe<string>;
}

export interface NftOwnershipAccessConditionDto {
  type: "nft_ownership";
  chainId: ChainId;
  contractAddress: string;
  standard: NftStandard;
  tokenId?: string;
  minBalance?: string;
  satisfied: boolean;
  currentBalance: Maybe<string>;
}

export type AccessPolicyConditionDto =
  | SubscriptionAccessConditionDto
  | TokenBalanceAccessConditionDto
  | NftOwnershipAccessConditionDto;

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
