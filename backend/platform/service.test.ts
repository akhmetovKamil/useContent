import { ObjectId } from "mongodb";
import { afterEach, describe, expect, test, vi } from "vitest";
import { createAuthorProfileDoc, createUserDoc } from "../test-helpers/fixtures";

const repositoryMocks = vi.hoisted(() => ({
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
  listPostAttachmentsByAuthorId: vi.fn(),
  listProjectFileNodesByAuthorId: vi.fn(),
  findPostAttachmentByIdAndPostId: vi.fn(),
  deletePostAttachmentById: vi.fn(),
  findProjectNodeByIdAndProjectId: vi.fn(),
  deleteProjectNodes: vi.fn(),
  createAuthorPlatformCleanupLog: vi.fn(),
  updateAuthorPlatformSubscriptionByAuthorId: vi.fn(),
}));

const storageMocks = vi.hoisted(() => ({
  deleteObject: vi.fn(),
}));

const onchainMocks = vi.hoisted(() => ({
  verifyPlatformSubscriptionPayment: vi.fn(),
}));

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

    static internal(message: string) {
      return new MockAPIError(message);
    }
  }

  return { APIError: MockAPIError };
});

vi.mock("./repository", () => repositoryMocks);
vi.mock("../profiles/repository", () => repositoryMocks);
vi.mock("../access/repository", () => repositoryMocks);
vi.mock("../subscriptions/repository", () => repositoryMocks);
vi.mock("../posts/repository", () => repositoryMocks);
vi.mock("../projects/repository", () => repositoryMocks);
vi.mock("../contracts/repository", () => repositoryMocks);
vi.mock("../storage/object-storage", () => storageMocks);
vi.mock("../onchain", () => ({
  readOnChainAccessGrants: vi.fn(),
  verifyPlatformSubscriptionPayment: onchainMocks.verifyPlatformSubscriptionPayment,
  verifyPlanRegistration: vi.fn(),
  verifySubscriptionPayment: vi.fn(),
}));

import {
  assertAuthorPlatformFeature,
  assertAuthorStorageQuota,
  buildAuthorPlatformBilling,
  cleanupExpiredAuthorPlatformStorage,
  confirmPlatformSubscriptionPayment,
  createPlatformSubscriptionPaymentIntent,
  listPlatformPlans,
  selectCleanupCandidates,
} from "./service";

describe("platform/service", () => {
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
    vi.mocked(
      repositoryMocks.findAuthorPlatformSubscriptionByAuthorId,
    ).mockResolvedValue(null);
    vi.mocked(repositoryMocks.sumPostAttachmentBytesByAuthorId).mockResolvedValue(
      500,
    );
    vi.mocked(repositoryMocks.sumProjectFileBytesByAuthorId).mockResolvedValue(
      700,
    );

    await expect(buildAuthorPlatformBilling(author)).resolves.toMatchObject({
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
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-15T00:00:00.000Z"));
    vi.mocked(
      repositoryMocks.findAuthorPlatformSubscriptionByAuthorId,
    ).mockResolvedValue({
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
    vi.mocked(repositoryMocks.sumPostAttachmentBytesByAuthorId).mockResolvedValue(
      1000,
    );
    vi.mocked(repositoryMocks.sumProjectFileBytesByAuthorId).mockResolvedValue(
      2000,
    );

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
    vi.mocked(
      repositoryMocks.findAuthorPlatformSubscriptionByAuthorId,
    ).mockResolvedValue({
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
    vi.mocked(repositoryMocks.sumPostAttachmentBytesByAuthorId).mockResolvedValue(
      0,
    );
    vi.mocked(repositoryMocks.sumProjectFileBytesByAuthorId).mockResolvedValue(
      0,
    );

    await expect(buildAuthorPlatformBilling(author)).resolves.toMatchObject({
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
    vi.mocked(
      repositoryMocks.findAuthorPlatformSubscriptionByAuthorId,
    ).mockResolvedValue({
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
    vi.mocked(repositoryMocks.sumPostAttachmentBytesByAuthorId).mockResolvedValue(
      500,
    );
    vi.mocked(repositoryMocks.sumProjectFileBytesByAuthorId).mockResolvedValue(
      700,
    );

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
    vi.mocked(
      repositoryMocks.findAuthorPlatformSubscriptionByAuthorId,
    ).mockResolvedValue(null);
    vi.mocked(repositoryMocks.sumPostAttachmentBytesByAuthorId).mockResolvedValue(
      0,
    );
    vi.mocked(repositoryMocks.sumProjectFileBytesByAuthorId).mockResolvedValue(
      0,
    );

    await expect(assertAuthorPlatformFeature(author, "projects")).rejects.toThrowError(
      "feature not available on current plan",
    );
  });

  test("rejects upload when free storage quota would be exceeded", async () => {
    const author = createAuthorProfileDoc();
    vi.mocked(
      repositoryMocks.findAuthorPlatformSubscriptionByAuthorId,
    ).mockResolvedValue(null);
    vi.mocked(repositoryMocks.sumPostAttachmentBytesByAuthorId).mockResolvedValue(
      1024 * 1024 * 1024,
    );
    vi.mocked(repositoryMocks.sumProjectFileBytesByAuthorId).mockResolvedValue(
      0,
    );

    await expect(assertAuthorStorageQuota(author, 1)).rejects.toThrowError(
      "storage quota exceeded",
    );
  });

  test("creates platform payment intent from deployed manager", async () => {
    const author = createAuthorProfileDoc();
    vi.mocked(repositoryMocks.findUserByPrimaryWallet).mockResolvedValue(
      createUserDoc({ primaryWallet: "0xabc0000000000000000000000000000000000000" }),
    );
    vi.mocked(repositoryMocks.findAuthorProfileByUserId).mockResolvedValue(
      author,
    );
    vi.mocked(repositoryMocks.findContractDeployment).mockResolvedValue({
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
    vi.mocked(repositoryMocks.createPlatformSubscriptionPaymentIntent)
      .mockImplementation(async (doc) => ({
        _id: new ObjectId("65f666666666666666666666"),
        ...doc,
      }));

    const intent = await createPlatformSubscriptionPaymentIntent(
      "0xabc0000000000000000000000000000000000000",
      {
        planCode: "basic",
        extraStorageGb: 2,
        chainId: 11155111,
        tokenAddress: "0xtoken000000000000000000000000000000000000",
      },
    );

    expect(intent).toMatchObject({
      planCode: "basic",
      extraStorageGb: 2,
      contractAddress: "0xmanager",
      amount: "7000000",
      status: "pending",
    });
  });

  test("confirms platform payment and updates author subscription", async () => {
    const author = createAuthorProfileDoc();
    const intentId = new ObjectId("65f777777777777777777777");
    const intent = {
      _id: intentId,
      authorId: author._id,
      walletAddress: "0xabc0000000000000000000000000000000000000",
      planCode: "basic" as const,
      tierKey: "0xtier",
      extraStorageGb: 1,
      chainId: 11155111,
      tokenAddress: "0xtoken000000000000000000000000000000000000",
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
      repositoryMocks.findPlatformSubscriptionPaymentIntentByIdAndWallet,
    ).mockResolvedValue(intent);
    vi.mocked(
      repositoryMocks.findPlatformSubscriptionPaymentIntentByTxHash,
    ).mockResolvedValue(null);
    vi.mocked(onchainMocks.verifyPlatformSubscriptionPayment).mockResolvedValue(
      {
        paidUntil: new Date("2026-05-01T00:00:00.000Z"),
      },
    );
    vi.mocked(repositoryMocks.updatePlatformSubscriptionPaymentIntent)
      .mockImplementation(async (_id, update) => ({ ...intent, ...update }));

    const confirmed = await confirmPlatformSubscriptionPayment(
      intent.walletAddress,
      intentId.toHexString(),
      { txHash: "0x" + "a".repeat(64) },
    );

    expect(confirmed.status).toBe("confirmed");
    expect(
      repositoryMocks.upsertAuthorPlatformSubscription,
    ).toHaveBeenCalledWith(
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

  test("cleans up expired storage using oldest selected files", async () => {
    const author = createAuthorProfileDoc();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-10T00:00:00.000Z"));
    vi.mocked(
      repositoryMocks.findAuthorPlatformSubscriptionByAuthorId,
    ).mockResolvedValue({
      _id: new ObjectId("65f888888888888888888888"),
      authorId: author._id,
      walletAddress: "0xabc",
      planCode: "basic",
      status: "expired",
      baseStorageBytes: 3 * 1024 * 1024 * 1024,
      extraStorageBytes: 0,
      totalStorageBytes: 3 * 1024 * 1024 * 1024,
      features: ["posts", "projects"],
      validUntil: new Date("2026-04-01T00:00:00.000Z"),
      graceUntil: new Date("2026-04-08T00:00:00.000Z"),
      cleanupScheduledAt: null,
      lastCleanupAt: null,
      lastTxHash: null,
      createdAt: new Date("2026-03-01T00:00:00.000Z"),
      updatedAt: new Date("2026-03-01T00:00:00.000Z"),
    });
    vi.mocked(repositoryMocks.sumPostAttachmentBytesByAuthorId)
      .mockResolvedValueOnce(1024 * 1024 * 1024 + 500)
      .mockResolvedValueOnce(1024 * 1024 * 1024);
    vi.mocked(repositoryMocks.sumProjectFileBytesByAuthorId)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);
    vi.mocked(repositoryMocks.listPostAttachmentsByAuthorId).mockResolvedValue([
      {
        _id: new ObjectId("65f999999999999999999991"),
        postId: new ObjectId("65f999999999999999999981"),
        authorId: author._id,
        kind: "image",
        fileName: "old.png",
        storageKey: "old-key",
        mimeType: "image/png",
        size: 500,
        createdAt: new Date("2026-04-01T00:00:00.000Z"),
      },
    ]);
    vi.mocked(repositoryMocks.listProjectFileNodesByAuthorId).mockResolvedValue(
      [],
    );
    vi.mocked(repositoryMocks.findPostAttachmentByIdAndPostId).mockResolvedValue(
      {
        _id: new ObjectId("65f999999999999999999991"),
        postId: new ObjectId("65f999999999999999999981"),
        authorId: author._id,
        kind: "image",
        fileName: "old.png",
        storageKey: "old-key",
        mimeType: "image/png",
        size: 500,
        createdAt: new Date("2026-04-01T00:00:00.000Z"),
      },
    );
    vi.mocked(repositoryMocks.deletePostAttachmentById).mockResolvedValue(true);
    vi.mocked(repositoryMocks.updateAuthorPlatformSubscriptionByAuthorId)
      .mockResolvedValue(null);
    vi.mocked(repositoryMocks.createAuthorPlatformCleanupLog)
      .mockImplementation(async (doc) => ({
        _id: new ObjectId("65faaaaaaaaaaaaaaaaaaaaa"),
        ...doc,
      }));

    const result = await cleanupExpiredAuthorPlatformStorage(author);

    expect(storageMocks.deleteObject).toHaveBeenCalledWith("old-key");
    expect(repositoryMocks.deletePostAttachmentById).toHaveBeenCalled();
    expect(result.status).toBe("completed");
    expect(result.deletedBytes).toBe(500);
  });
});
