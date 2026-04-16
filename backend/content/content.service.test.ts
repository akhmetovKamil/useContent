import { ObjectId } from "mongodb";
import { afterEach, describe, expect, test, vi } from "vitest";

vi.mock("encore.dev/api", () => {
  class MockAPIError extends Error {
    static invalidArgument(message: string) {
      return new MockAPIError(message);
    }
  }

  return {
    APIError: MockAPIError,
  };
});

vi.mock("../storage/object-storage", () => {
  return {
    deleteObject: vi.fn(),
  };
});

import * as repo from "./repository";
import { buildAccessPolicyFromInput } from "./content.service";
import type { AuthorProfileDoc } from "./types";

vi.mock("./repository", () => {
  return {
    findSubscriptionPlanByAuthorIdAndCode: vi.fn(),
  };
});

describe("buildAccessPolicyFromInput", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  test("builds token and nft composite policy", async () => {
    const author = createAuthorProfileDoc();

    const policy = await buildAccessPolicyFromInput(
      {
        root: {
          type: "and",
          children: [
            {
              type: "token_balance",
              chainId: 1,
              contractAddress: "0xABCDEF",
              minAmount: "100",
              decimals: 18,
            },
            {
              type: "nft_ownership",
              chainId: 1,
              contractAddress: "0x123456",
              standard: "erc721",
              tokenId: "7",
            },
          ],
        },
      },
      author,
    );

    expect(policy).toEqual({
      version: 1,
      root: {
        type: "and",
        children: [
          {
            type: "token_balance",
            chainId: 1,
            contractAddress: "0xabcdef",
            minAmount: "100",
            decimals: 18,
          },
          {
            type: "nft_ownership",
            chainId: 1,
            contractAddress: "0x123456",
            standard: "erc721",
            tokenId: "7",
            minBalance: undefined,
          },
        ],
      },
    });
  });

  test("builds subscription node from plan code", async () => {
    const author = createAuthorProfileDoc();
    vi.mocked(repo.findSubscriptionPlanByAuthorIdAndCode).mockResolvedValue({
      _id: new ObjectId("65f111111111111111111111"),
      authorId: author._id,
      code: "main",
      title: "Main",
      paymentAsset: "native",
      chainId: 11155111,
      tokenAddress: "0x0000000000000000000000000000000000000000",
      price: "1000000",
      billingPeriodDays: 30,
      contractAddress: "0x0000000000000000000000000000000000000000",
      planKey:
        "0x1111111111111111111111111111111111111111111111111111111111111111",
      registrationTxHash: null,
      active: true,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const policy = await buildAccessPolicyFromInput(
      {
        root: {
          type: "subscription",
          planCode: "main",
        },
      },
      author,
    );

    expect(repo.findSubscriptionPlanByAuthorIdAndCode).toHaveBeenCalledWith(
      author._id,
      "main",
    );
    expect(policy).toEqual({
      version: 1,
      root: {
        type: "subscription",
        authorId: author._id.toHexString(),
        planId: "65f111111111111111111111",
      },
    });
  });

  test("rejects subscription input without author profile", async () => {
    await expect(
      buildAccessPolicyFromInput(
        {
          root: {
            type: "subscription",
          },
        },
        null,
      ),
    ).rejects.toThrowError(
      "subscription policy input requires an existing author profile",
    );
  });
});

function createAuthorProfileDoc(): AuthorProfileDoc {
  return {
    _id: new ObjectId("65f000000000000000000001"),
    userId: "65f000000000000000000099",
    slug: "kamil",
    displayName: "Kamil",
    bio: "",
    avatarFileId: null,
    defaultPolicy: {
      version: 1,
      root: { type: "public" },
    },
    defaultPolicyId: null,
    subscriptionPlanId: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  };
}
