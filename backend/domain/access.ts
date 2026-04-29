export {
  ACCESS_POLICY_VERSION,
  type AccessPolicy,
  type AccessPolicyNode,
  type AndPolicyNode,
  type NftOwnershipPolicyNode,
  type OrPolicyNode,
  type PolicyMode,
  type PublicPolicyNode,
  type SubscriptionPolicyNode,
  type TokenBalancePolicyNode,
} from "../../shared/types/access";
import {
  ACCESS_POLICY_NODE_TYPE,
  NFT_STANDARD,
  POLICY_MODE,
  type NftStandard,
  type PolicyMode,
} from "../../shared/consts";
import { isSameAddressLike } from "../../shared/utils/web3";

import {
  ACCESS_POLICY_VERSION,
  type AccessPolicy,
  type AccessPolicyNode,
  type NftOwnershipPolicyNode,
  type SubscriptionPolicyNode,
  type TokenBalancePolicyNode,
} from "../../shared/types/access";

export interface SubscriptionGrant {
  authorId: string;
  planId: string;
  active: boolean;
  validUntil?: string;
}

export interface TokenBalanceGrant {
  chainId: number;
  contractAddress: string;
  balance: string;
}

export interface NftOwnershipGrant {
  chainId: number;
  contractAddress: string;
  standard: NftStandard;
  tokenId?: string;
  balance?: string;
}

export interface AccessEvaluationContext {
  subscriptions?: SubscriptionGrant[];
  tokenBalances?: TokenBalanceGrant[];
  nftOwnerships?: NftOwnershipGrant[];
}

export interface AccessEvaluationResult {
  allowed: boolean;
  reason:
    | "public"
    | "subscription"
    | "token_balance"
    | "nft_ownership"
    | "or"
    | "and"
    | "missing_subscription"
    | "missing_token_balance"
    | "missing_nft_ownership"
    | "unsupported_policy"
    | "invalid_policy";
}

export function createPublicPolicy(): AccessPolicy {
  return {
    version: ACCESS_POLICY_VERSION,
    root: { type: ACCESS_POLICY_NODE_TYPE.PUBLIC },
  };
}

export function isAccessPolicy(value: unknown): value is AccessPolicy {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<AccessPolicy>;
  return (
    candidate.version === ACCESS_POLICY_VERSION &&
    isAccessPolicyNode(candidate.root)
  );
}

export function resolveEntityPolicy(
  policyMode: PolicyMode,
  authorDefaultPolicy: AccessPolicy,
  customPolicy?: AccessPolicy | null,
): AccessPolicy {
  if (policyMode === POLICY_MODE.PUBLIC) {
    return createPublicPolicy();
  }

  if (policyMode === POLICY_MODE.CUSTOM) {
    if (!customPolicy) {
      throw new Error("custom_policy_required");
    }
    return customPolicy;
  }

  return authorDefaultPolicy;
}

export function evaluateAccessPolicy(
  policy: AccessPolicy,
  context: AccessEvaluationContext,
): AccessEvaluationResult {
  if (!isAccessPolicy(policy)) {
    return { allowed: false, reason: "invalid_policy" };
  }

  return evaluatePolicyNode(policy.root, context);
}

function evaluatePolicyNode(
  node: AccessPolicyNode,
  context: AccessEvaluationContext,
): AccessEvaluationResult {
  switch (node.type) {
    case ACCESS_POLICY_NODE_TYPE.PUBLIC:
      return { allowed: true, reason: ACCESS_POLICY_NODE_TYPE.PUBLIC };
    case ACCESS_POLICY_NODE_TYPE.SUBSCRIPTION:
      return hasActiveSubscription(node, context)
        ? { allowed: true, reason: ACCESS_POLICY_NODE_TYPE.SUBSCRIPTION }
        : { allowed: false, reason: "missing_subscription" };
    case ACCESS_POLICY_NODE_TYPE.TOKEN_BALANCE:
      return hasRequiredTokenBalance(node, context)
        ? { allowed: true, reason: ACCESS_POLICY_NODE_TYPE.TOKEN_BALANCE }
        : { allowed: false, reason: "missing_token_balance" };
    case ACCESS_POLICY_NODE_TYPE.NFT_OWNERSHIP:
      return hasRequiredNftOwnership(node, context)
        ? { allowed: true, reason: ACCESS_POLICY_NODE_TYPE.NFT_OWNERSHIP }
        : { allowed: false, reason: "missing_nft_ownership" };
    case ACCESS_POLICY_NODE_TYPE.OR:
      for (const child of node.children) {
        const result = evaluatePolicyNode(child, context);
        if (result.allowed) {
          return { allowed: true, reason: ACCESS_POLICY_NODE_TYPE.OR };
        }
      }

      return { allowed: false, reason: "invalid_policy" };
    case ACCESS_POLICY_NODE_TYPE.AND:
      for (const child of node.children) {
        const result = evaluatePolicyNode(child, context);
        if (!result.allowed) {
          return result;
        }
      }

      return { allowed: true, reason: ACCESS_POLICY_NODE_TYPE.AND };
    default:
      return { allowed: false, reason: "unsupported_policy" };
  }
}

function isAccessPolicyNode(value: unknown): value is AccessPolicyNode {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as {
    type?: string;
    authorId?: unknown;
    planId?: unknown;
    chainId?: unknown;
    contractAddress?: unknown;
    minAmount?: unknown;
    decimals?: unknown;
    standard?: unknown;
    tokenId?: unknown;
    minBalance?: unknown;
    children?: unknown;
  };

  switch (candidate.type) {
    case ACCESS_POLICY_NODE_TYPE.PUBLIC:
      return true;
    case ACCESS_POLICY_NODE_TYPE.SUBSCRIPTION:
      return (
        typeof candidate.authorId === "string" &&
        candidate.authorId.length > 0 &&
        typeof candidate.planId === "string" &&
        candidate.planId.length > 0
      );
    case ACCESS_POLICY_NODE_TYPE.TOKEN_BALANCE:
      return (
        typeof candidate.chainId === "number" &&
        Number.isInteger(candidate.chainId) &&
        candidate.chainId > 0 &&
        typeof candidate.contractAddress === "string" &&
        candidate.contractAddress.length > 0 &&
        typeof candidate.minAmount === "string" &&
        /^[0-9]+$/.test(candidate.minAmount) &&
        typeof candidate.decimals === "number" &&
        Number.isInteger(candidate.decimals) &&
        candidate.decimals >= 0
      );
    case ACCESS_POLICY_NODE_TYPE.NFT_OWNERSHIP:
      return (
        typeof candidate.chainId === "number" &&
        Number.isInteger(candidate.chainId) &&
        candidate.chainId > 0 &&
        typeof candidate.contractAddress === "string" &&
        candidate.contractAddress.length > 0 &&
        (candidate.standard === NFT_STANDARD.ERC721 ||
          candidate.standard === NFT_STANDARD.ERC1155) &&
        (candidate.tokenId === undefined ||
          typeof candidate.tokenId === "string") &&
        (candidate.minBalance === undefined ||
          (typeof candidate.minBalance === "string" &&
            /^[0-9]+$/.test(candidate.minBalance)))
      );
    case ACCESS_POLICY_NODE_TYPE.OR:
    case ACCESS_POLICY_NODE_TYPE.AND:
      return (
        Array.isArray(candidate.children) &&
        candidate.children.length > 0 &&
        candidate.children.every((child) => isAccessPolicyNode(child))
      );
    default:
      return false;
  }
}

function hasActiveSubscription(
  node: SubscriptionPolicyNode,
  context: AccessEvaluationContext,
): boolean {
  return (
    context.subscriptions?.some(
      (grant) =>
        grant.active &&
        grant.authorId === node.authorId &&
        grant.planId === node.planId,
    ) ?? false
  );
}

function hasRequiredTokenBalance(
  node: TokenBalancePolicyNode,
  context: AccessEvaluationContext,
): boolean {
  const grant = context.tokenBalances?.find(
    (entry) =>
      entry.chainId === node.chainId &&
      isSameAddressLike(entry.contractAddress, node.contractAddress),
  );

  if (!grant) {
    return false;
  }

  return BigInt(grant.balance) >= BigInt(node.minAmount);
}

function hasRequiredNftOwnership(
  node: NftOwnershipPolicyNode,
  context: AccessEvaluationContext,
): boolean {
  return (
    context.nftOwnerships?.some((grant) => {
      if (
        grant.chainId !== node.chainId ||
        !isSameAddressLike(grant.contractAddress, node.contractAddress) ||
        grant.standard !== node.standard
      ) {
        return false;
      }

      if (node.tokenId && grant.tokenId !== node.tokenId) {
        return false;
      }

      if (!node.minBalance) {
        return true;
      }

      return BigInt(grant.balance ?? "0") >= BigInt(node.minBalance);
    }) ?? false
  );
}
