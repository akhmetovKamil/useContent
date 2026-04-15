import { describe, expect, test } from "vitest";
import {
  ACCESS_POLICY_VERSION,
  createPublicPolicy,
  evaluateAccessPolicy,
  resolveEntityPolicy,
  type AccessPolicy,
} from "./access";

describe("resolveEntityPolicy", () => {
  const inheritedPolicy = createPublicPolicy();
  const customPolicy: AccessPolicy = {
    version: ACCESS_POLICY_VERSION,
    root: {
      type: "subscription",
      authorId: "author_1",
      planId: "main",
    },
  };

  test("returns public policy for public mode", () => {
    const resolved = resolveEntityPolicy("public", inheritedPolicy, customPolicy);
    expect(resolved.root.type).toBe("public");
  });

  test("returns author policy for inherited mode", () => {
    const resolved = resolveEntityPolicy("inherited", inheritedPolicy, customPolicy);
    expect(resolved).toBe(inheritedPolicy);
  });

  test("returns custom policy for custom mode", () => {
    const resolved = resolveEntityPolicy("custom", inheritedPolicy, customPolicy);
    expect(resolved).toBe(customPolicy);
  });

  test("throws when custom mode has no policy", () => {
    expect(() =>
      resolveEntityPolicy("custom", inheritedPolicy, null)
    ).toThrowError("custom_policy_required");
  });
});

describe("evaluateAccessPolicy", () => {
  test("allows public policy", () => {
    expect(evaluateAccessPolicy(createPublicPolicy(), {})).toEqual({
      allowed: true,
      reason: "public",
    });
  });

  test("allows active subscription", () => {
    const policy: AccessPolicy = {
      version: ACCESS_POLICY_VERSION,
      root: {
        type: "subscription",
        authorId: "author_1",
        planId: "main",
      },
    };

    expect(
      evaluateAccessPolicy(policy, {
        subscriptions: [{ authorId: "author_1", planId: "main", active: true }],
      })
    ).toEqual({
      allowed: true,
      reason: "subscription",
    });
  });

  test("denies missing subscription", () => {
    const policy: AccessPolicy = {
      version: ACCESS_POLICY_VERSION,
      root: {
        type: "subscription",
        authorId: "author_1",
        planId: "main",
      },
    };

    expect(evaluateAccessPolicy(policy, {})).toEqual({
      allowed: false,
      reason: "missing_subscription",
    });
  });

  test("allows token balance when minimum is met", () => {
    const policy: AccessPolicy = {
      version: ACCESS_POLICY_VERSION,
      root: {
        type: "token_balance",
        chainId: 1,
        contractAddress: "0xABCDEF",
        minAmount: "100",
        decimals: 18,
      },
    };

    expect(
      evaluateAccessPolicy(policy, {
        tokenBalances: [
          { chainId: 1, contractAddress: "0xabcdef", balance: "120" },
        ],
      })
    ).toEqual({
      allowed: true,
      reason: "token_balance",
    });
  });

  test("allows nft ownership with exact token id", () => {
    const policy: AccessPolicy = {
      version: ACCESS_POLICY_VERSION,
      root: {
        type: "nft_ownership",
        chainId: 1,
        contractAddress: "0xABCDEF",
        standard: "erc721",
        tokenId: "7",
      },
    };

    expect(
      evaluateAccessPolicy(policy, {
        nftOwnerships: [
          {
            chainId: 1,
            contractAddress: "0xabcdef",
            standard: "erc721",
            tokenId: "7",
          },
        ],
      })
    ).toEqual({
      allowed: true,
      reason: "nft_ownership",
    });
  });

  test("allows or policy when one child matches", () => {
    const policy: AccessPolicy = {
      version: ACCESS_POLICY_VERSION,
      root: {
        type: "or",
        children: [
          {
            type: "subscription",
            authorId: "author_1",
            planId: "main",
          },
          {
            type: "token_balance",
            chainId: 1,
            contractAddress: "0xabcdef",
            minAmount: "100",
            decimals: 18,
          },
        ],
      },
    };

    expect(
      evaluateAccessPolicy(policy, {
        tokenBalances: [
          { chainId: 1, contractAddress: "0xabcdef", balance: "100" },
        ],
      })
    ).toEqual({
      allowed: true,
      reason: "or",
    });
  });

  test("rejects empty or policy as invalid", () => {
    const policy: AccessPolicy = {
      version: ACCESS_POLICY_VERSION,
      root: {
        type: "or",
        children: [],
      },
    };

    expect(evaluateAccessPolicy(policy, {})).toEqual({
      allowed: false,
      reason: "invalid_policy",
    });
  });
});
