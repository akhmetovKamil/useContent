import { ObjectId } from "mongodb";
import { afterEach, describe, expect, test, vi } from "vitest";

vi.mock("encore.dev/api", () => {
  class MockAPIError extends Error {
    static invalidArgument(message: string) {
      return new MockAPIError(message);
    }

    static failedPrecondition(message: string) {
      return new MockAPIError(message);
    }

    static notFound(message: string) {
      return new MockAPIError(message);
    }

    static alreadyExists(message: string) {
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

vi.mock("./onchain", () => {
  return {
    verifyPlatformSubscriptionPayment: vi.fn(),
  };
});

import * as repo from "./repository";
import { verifyPlatformSubscriptionPayment } from "./onchain";
import {
  buildAccessPolicyFromInput,
  buildAuthorPlatformBilling,
  assertAuthorPlatformFeature,
  assertAuthorStorageQuota,
  confirmPlatformSubscriptionPayment,
  createPlatformSubscriptionPaymentIntent,
  listPlatformPlans,
  selectCleanupCandidates,
  toAuthorStorageUsageResponse,
} from "./content.service";
import type { AuthorProfileDoc } from "./types";

vi.mock("./repository", () => {
  return {
    findSubscriptionPlanByAuthorIdAndCode: vi.fn(),
    findUserByPrimaryWallet: vi.fn(),
    findAuthorProfileByUserId: vi.fn(),
    findContractDeployment: vi.fn(),
    findAuthorPlatformSubscriptionByAuthorId: vi.fn(),
    createPlatformSubscriptionPaymentIntent: vi.fn(),
    findPlatformSubscriptionPaymentIntentByIdAndWallet: vi.fn(),
    findPlatformSubscriptionPaymentIntentByTxHash: vi.fn(),
    updatePlatformSubscriptionPaymentIntent: vi.fn(),
    upsertAuthorPlatformSubscription: vi.fn(),
    sumPostAttachmentBytesByAuthorId: vi.fn(),
    sumProjectFileBytesByAuthorId: vi.fn(),
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

describe("toAuthorStorageUsageResponse", () => {
  test("combines post attachment and project file bytes", () => {
    const author = createAuthorProfileDoc();

    expect(
      toAuthorStorageUsageResponse(author, {
        postsBytes: 1200,
        projectsBytes: 3400,
      }),
    ).toEqual({
      authorId: author._id.toHexString(),
      postsBytes: 1200,
      projectsBytes: 3400,
      totalUsedBytes: 4600,
    });
  });
});

describe("platform billing foundation", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  test("lists free and basic platform plans", () => {
    const plans = listPlatformPlans();

    expect(plans.map((plan) => plan.code)).toEqual(["free", "basic"]);
    expect(plans[0]?.baseStorageBytes).toBe(1024 * 1024 * 1024);
    expect(plans[1]?.features).toContain("projects");
  });

  test("uses free billing state by default", async () => {
    const author = createAuthorProfileDoc();
    vi.mocked(repo.findAuthorPlatformSubscriptionByAuthorId).mockResolvedValue(
      null,
    );
    vi.mocked(repo.sumPostAttachmentBytesByAuthorId).mockResolvedValue(500);
    vi.mocked(repo.sumProjectFileBytesByAuthorId).mockResolvedValue(700);

    await expect(buildAuthorPlatformBilling(author)).resolves.toMatchObject({
      authorId: author._id.toHexString(),
      planCode: "free",
      status: "free",
      usedStorageBytes: 1200,
      totalStorageBytes: 1024 * 1024 * 1024,
      isProjectCreationAllowed: false,
      isUploadAllowed: true,
    });
  });

  test("uses active basic subscription limits", async () => {
    const author = createAuthorProfileDoc();
    vi.mocked(repo.findAuthorPlatformSubscriptionByAuthorId).mockResolvedValue({
      _id: new ObjectId("65f222222222222222222222"),
      authorId: author._id,
      walletAddress: "0xabc",
      planCode: "basic",
      status: "active",
      baseStorageBytes: 3 * 1024 * 1024 * 1024,
      extraStorageBytes: 2 * 1024 * 1024 * 1024,
      totalStorageBytes: 5 * 1024 * 1024 * 1024,
      features: ["posts", "projects", "homepage_promo"],
      validUntil: new Date("2026-05-01T00:00:00.000Z"),
      graceUntil: null,
      cleanupScheduledAt: null,
      lastCleanupAt: null,
      lastTxHash: null,
      createdAt: new Date("2026-04-01T00:00:00.000Z"),
      updatedAt: new Date("2026-04-01T00:00:00.000Z"),
    });
    vi.mocked(repo.sumPostAttachmentBytesByAuthorId).mockResolvedValue(1000);
    vi.mocked(repo.sumProjectFileBytesByAuthorId).mockResolvedValue(2000);

    await expect(buildAuthorPlatformBilling(author)).resolves.toMatchObject({
      planCode: "basic",
      status: "active",
      usedStorageBytes: 3000,
      totalStorageBytes: 5 * 1024 * 1024 * 1024,
      isProjectCreationAllowed: true,
      features: ["posts", "projects", "homepage_promo"],
    });
  });

  test("puts expired active subscription into grace", async () => {
    const author = createAuthorProfileDoc();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-05T00:00:00.000Z"));
    vi.mocked(repo.findAuthorPlatformSubscriptionByAuthorId).mockResolvedValue({
      _id: new ObjectId("65f333333333333333333333"),
      authorId: author._id,
      walletAddress: "0xabc",
      planCode: "basic",
      status: "active",
      baseStorageBytes: 3 * 1024 * 1024 * 1024,
      extraStorageBytes: 0,
      totalStorageBytes: 3 * 1024 * 1024 * 1024,
      features: ["posts", "projects", "homepage_promo"],
      validUntil: new Date("2026-04-01T00:00:00.000Z"),
      graceUntil: null,
      cleanupScheduledAt: null,
      lastCleanupAt: null,
      lastTxHash: null,
      createdAt: new Date("2026-03-01T00:00:00.000Z"),
      updatedAt: new Date("2026-03-01T00:00:00.000Z"),
    });
    vi.mocked(repo.sumPostAttachmentBytesByAuthorId).mockResolvedValue(0);
    vi.mocked(repo.sumProjectFileBytesByAuthorId).mockResolvedValue(0);

    await expect(buildAuthorPlatformBilling(author)).resolves.toMatchObject({
      planCode: "basic",
      status: "grace",
      graceUntil: "2026-04-08T00:00:00.000Z",
      isProjectCreationAllowed: false,
      isUploadAllowed: false,
    });
  });

  test("applies free quota after grace expires", async () => {
    const author = createAuthorProfileDoc();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-10T00:00:00.000Z"));
    vi.mocked(repo.findAuthorPlatformSubscriptionByAuthorId).mockResolvedValue({
      _id: new ObjectId("65f444444444444444444444"),
      authorId: author._id,
      walletAddress: "0xabc",
      planCode: "basic",
      status: "active",
      baseStorageBytes: 3 * 1024 * 1024 * 1024,
      extraStorageBytes: 0,
      totalStorageBytes: 3 * 1024 * 1024 * 1024,
      features: ["posts", "projects", "homepage_promo"],
      validUntil: new Date("2026-04-01T00:00:00.000Z"),
      graceUntil: new Date("2026-04-08T00:00:00.000Z"),
      cleanupScheduledAt: null,
      lastCleanupAt: null,
      lastTxHash: null,
      createdAt: new Date("2026-03-01T00:00:00.000Z"),
      updatedAt: new Date("2026-03-01T00:00:00.000Z"),
    });
    vi.mocked(repo.sumPostAttachmentBytesByAuthorId).mockResolvedValue(500);
    vi.mocked(repo.sumProjectFileBytesByAuthorId).mockResolvedValue(700);

    await expect(buildAuthorPlatformBilling(author)).resolves.toMatchObject({
      planCode: "free",
      status: "expired",
      usedStorageBytes: 1200,
      totalStorageBytes: 1024 * 1024 * 1024,
      isProjectCreationAllowed: false,
      isUploadAllowed: true,
    });
  });

  test("selects oldest cleanup candidates until target bytes are covered", () => {
    expect(
      selectCleanupCandidates(
        [
          {
            id: "1",
            kind: "post_attachment",
            parentId: "post",
            fileName: "old.png",
            storageKey: "old",
            size: 400,
            createdAt: "2026-04-01T00:00:00.000Z",
          },
          {
            id: "2",
            kind: "project_file",
            parentId: "project",
            fileName: "next.zip",
            storageKey: "next",
            size: 700,
            createdAt: "2026-04-02T00:00:00.000Z",
          },
        ],
        500,
      ),
    ).toHaveLength(2);
  });

  test("rejects project feature on free plan", async () => {
    const author = createAuthorProfileDoc();
    vi.mocked(repo.findAuthorPlatformSubscriptionByAuthorId).mockResolvedValue(
      null,
    );
    vi.mocked(repo.sumPostAttachmentBytesByAuthorId).mockResolvedValue(0);
    vi.mocked(repo.sumProjectFileBytesByAuthorId).mockResolvedValue(0);

    await expect(
      assertAuthorPlatformFeature(author, "projects"),
    ).rejects.toThrowError("feature not available on current plan");
  });

  test("rejects upload when free storage quota would be exceeded", async () => {
    const author = createAuthorProfileDoc();
    vi.mocked(repo.findAuthorPlatformSubscriptionByAuthorId).mockResolvedValue(
      null,
    );
    vi.mocked(repo.sumPostAttachmentBytesByAuthorId).mockResolvedValue(
      1024 * 1024 * 1024,
    );
    vi.mocked(repo.sumProjectFileBytesByAuthorId).mockResolvedValue(0);

    await expect(assertAuthorStorageQuota(author, 1)).rejects.toThrowError(
      "storage quota exceeded",
    );
  });

  test("creates platform payment intent from deployed manager", async () => {
    const author = createAuthorProfileDoc();
    vi.mocked(repo.findUserByPrimaryWallet).mockResolvedValue({
      _id: new ObjectId(author.userId),
      username: null,
      displayName: "Kamil",
      bio: "",
      avatarFileId: null,
      primaryWallet: "0xabc",
      wallets: [],
      role: "user",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });
    vi.mocked(repo.findAuthorProfileByUserId).mockResolvedValue(author);
    vi.mocked(repo.findContractDeployment).mockResolvedValue({
      _id: new ObjectId("65f555555555555555555555"),
      chainId: 11155111,
      contractName: "PlatformSubscriptionManager",
      address: "0xmanager",
      platformTreasury: "0xtreasury",
      deployedBy: "0xdeployer",
      deploymentTxHash: null,
      createdAt: new Date("2026-04-01T00:00:00.000Z"),
      updatedAt: new Date("2026-04-01T00:00:00.000Z"),
    });
    vi.mocked(repo.createPlatformSubscriptionPaymentIntent).mockImplementation(
      async (doc) => ({
        _id: new ObjectId("65f666666666666666666666"),
        ...doc,
      }),
    );

    const intent = await createPlatformSubscriptionPaymentIntent("0xabc", {
      planCode: "basic",
      extraStorageGb: 2,
      chainId: 11155111,
      tokenAddress: "0xtoken",
    });

    expect(intent).toMatchObject({
      planCode: "basic",
      extraStorageGb: 2,
      contractAddress: "0xmanager",
      amount: "7000000",
      status: "pending",
    });
    expect(repo.createPlatformSubscriptionPaymentIntent).toHaveBeenCalledWith(
      expect.objectContaining({
        authorId: author._id,
        tierKey: expect.any(String),
      }),
    );
  });

  test("confirms platform payment and updates author subscription", async () => {
    const author = createAuthorProfileDoc();
    const intentId = new ObjectId("65f777777777777777777777");
    const intent = {
      _id: intentId,
      authorId: author._id,
      walletAddress: "0xabc",
      planCode: "basic" as const,
      tierKey: "0xtier",
      extraStorageGb: 1,
      chainId: 11155111,
      tokenAddress: "0xtoken",
      contractAddress: "0xmanager",
      amount: "6000000",
      status: "pending" as const,
      txHash: null,
      validUntil: null,
      expiresAt: new Date("2026-04-01T00:30:00.000Z"),
      createdAt: new Date("2026-04-01T00:00:00.000Z"),
      updatedAt: new Date("2026-04-01T00:00:00.000Z"),
    };
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-01T00:05:00.000Z"));
    vi.mocked(
      repo.findPlatformSubscriptionPaymentIntentByIdAndWallet,
    ).mockResolvedValue(intent);
    vi.mocked(
      repo.findPlatformSubscriptionPaymentIntentByTxHash,
    ).mockResolvedValue(null);
    vi.mocked(verifyPlatformSubscriptionPayment).mockResolvedValue({
      paidUntil: new Date("2026-05-01T00:00:00.000Z"),
    });
    vi.mocked(repo.updatePlatformSubscriptionPaymentIntent).mockImplementation(
      async (_id, update) => ({ ...intent, ...update }),
    );

    const confirmed = await confirmPlatformSubscriptionPayment(
      "0xabc",
      intentId.toHexString(),
      { txHash: "0x" + "a".repeat(64) },
    );

    expect(confirmed.status).toBe("confirmed");
    expect(repo.upsertAuthorPlatformSubscription).toHaveBeenCalledWith(
      expect.objectContaining({
        authorId: author._id,
        planCode: "basic",
        extraStorageBytes: 1024 * 1024 * 1024,
        totalStorageBytes: 4 * 1024 * 1024 * 1024,
        lastTxHash: "0x" + "a".repeat(64),
      }),
      expect.any(Date),
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
    tags: [],
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
