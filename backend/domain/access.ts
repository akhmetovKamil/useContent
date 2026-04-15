export {
  ACCESS_POLICY_VERSION,
  type AccessPolicy,
  type AccessPolicyNode,
  type NftOwnershipPolicyNode,
  type OrPolicyNode,
  type PolicyMode,
  type PublicPolicyNode,
  type SubscriptionPolicyNode,
  type TokenBalancePolicyNode,
} from "../../contracts/types/access";

import {
  ACCESS_POLICY_VERSION,
  type AccessPolicy,
  type AccessPolicyNode,
  type NftOwnershipPolicyNode,
  type PolicyMode,
  type SubscriptionPolicyNode,
  type TokenBalancePolicyNode,
} from "../../contracts/types/access";

export interface SubscriptionGrant {
  authorId: string;
  planId: string;
  active: boolean;
}

export interface TokenBalanceGrant {
  chainId: number;
  contractAddress: string;
  balance: string;
}

export interface NftOwnershipGrant {
  chainId: number;
  contractAddress: string;
  standard: "erc721" | "erc1155";
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
    | "missing_subscription"
    | "missing_token_balance"
    | "missing_nft_ownership"
    | "unsupported_policy"
    | "invalid_policy";
}

export function createPublicPolicy(): AccessPolicy {
  return {
    version: ACCESS_POLICY_VERSION,
    root: { type: "public" },
  };
}

export function isAccessPolicy(value: unknown): value is AccessPolicy {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<AccessPolicy>;
  return candidate.version === ACCESS_POLICY_VERSION && !!candidate.root;
}

export function resolveEntityPolicy(
  policyMode: PolicyMode,
  authorDefaultPolicy: AccessPolicy,
  customPolicy?: AccessPolicy | null
): AccessPolicy {
  if (policyMode === "public") {
    return createPublicPolicy();
  }

  if (policyMode === "custom") {
    if (!customPolicy) {
      throw new Error("custom_policy_required");
    }
    return customPolicy;
  }

  return authorDefaultPolicy;
}

export function evaluateAccessPolicy(
  policy: AccessPolicy,
  context: AccessEvaluationContext
): AccessEvaluationResult {
  if (!isAccessPolicy(policy)) {
    return { allowed: false, reason: "invalid_policy" };
  }

  return evaluatePolicyNode(policy.root, context);
}

function evaluatePolicyNode(
  node: AccessPolicyNode,
  context: AccessEvaluationContext
): AccessEvaluationResult {
  switch (node.type) {
    case "public":
      return { allowed: true, reason: "public" };
    case "subscription":
      return hasActiveSubscription(node, context)
        ? { allowed: true, reason: "subscription" }
        : { allowed: false, reason: "missing_subscription" };
    case "token_balance":
      return hasRequiredTokenBalance(node, context)
        ? { allowed: true, reason: "token_balance" }
        : { allowed: false, reason: "missing_token_balance" };
    case "nft_ownership":
      return hasRequiredNftOwnership(node, context)
        ? { allowed: true, reason: "nft_ownership" }
        : { allowed: false, reason: "missing_nft_ownership" };
    case "or":
      if (node.children.length === 0) {
        return { allowed: false, reason: "invalid_policy" };
      }

      for (const child of node.children) {
        const result = evaluatePolicyNode(child, context);
        if (result.allowed) {
          return { allowed: true, reason: "or" };
        }
      }

      return { allowed: false, reason: "invalid_policy" };
    default:
      return { allowed: false, reason: "unsupported_policy" };
  }
}

function hasActiveSubscription(
  node: SubscriptionPolicyNode,
  context: AccessEvaluationContext
): boolean {
  return (
    context.subscriptions?.some(
      (grant) =>
        grant.active &&
        grant.authorId === node.authorId &&
        grant.planId === node.planId
    ) ?? false
  );
}

function hasRequiredTokenBalance(
  node: TokenBalancePolicyNode,
  context: AccessEvaluationContext
): boolean {
  const grant = context.tokenBalances?.find(
    (entry) =>
      entry.chainId === node.chainId &&
      normalizeAddress(entry.contractAddress) ===
        normalizeAddress(node.contractAddress)
  );

  if (!grant) {
    return false;
  }

  return BigInt(grant.balance) >= BigInt(node.minAmount);
}

function hasRequiredNftOwnership(
  node: NftOwnershipPolicyNode,
  context: AccessEvaluationContext
): boolean {
  return (
    context.nftOwnerships?.some((grant) => {
      if (
        grant.chainId !== node.chainId ||
        normalizeAddress(grant.contractAddress) !==
          normalizeAddress(node.contractAddress) ||
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

function normalizeAddress(address: string): string {
  return address.toLowerCase();
}
