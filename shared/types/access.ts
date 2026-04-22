import type {
  AuthorOwnedDto,
  BaseEntityDto,
  Maybe,
  NullableDateString,
} from "./common";
import type { SubscriptionPlanDto } from "./subscriptions";

export const ACCESS_POLICY_VERSION = 1;

export type PolicyMode = "public" | "inherited" | "custom";

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
  chainId: number;
  contractAddress: string;
  minAmount: string;
  decimals: number;
}

export interface NftOwnershipPolicyNode {
  type: "nft_ownership";
  chainId: number;
  contractAddress: string;
  standard: "erc721" | "erc1155";
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
  conditionMode: "single" | "and" | "or";
  conditions: AccessPolicyConditionDto[];
}

export type AccessPolicyConditionDto =
  | {
      type: "subscription";
      plan: SubscriptionPlanDto;
      satisfied: boolean;
      validUntil: NullableDateString;
    }
  | {
      type: "token_balance";
      chainId: number;
      contractAddress: string;
      minAmount: string;
      decimals: number;
      satisfied: boolean;
      currentBalance: Maybe<string>;
    }
  | {
      type: "nft_ownership";
      chainId: number;
      contractAddress: string;
      standard: "erc721" | "erc1155";
      tokenId?: string;
      minBalance?: string;
      satisfied: boolean;
      currentBalance: Maybe<string>;
    };

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
