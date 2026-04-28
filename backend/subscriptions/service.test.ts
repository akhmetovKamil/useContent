import { ObjectId } from "mongodb";
import { afterEach, describe, expect, test, vi } from "vitest";
import { createAuthorProfileDoc } from "../test-helpers/fixtures";

const repositoryMocks = vi.hoisted(() => ({
  findSubscriptionPlanByAuthorIdAndCode: vi.fn(),
  createSubscriptionPaymentIntent: vi.fn(),
  findSubscriptionPaymentIntentByIdAndWallet: vi.fn(),
  updateSubscriptionPaymentIntent: vi.fn(),
  findSubscriptionPaymentIntentByTxHash: vi.fn(),
  upsertActiveSubscriptionEntitlement: vi.fn(),
  listSubscriptionEntitlementsByWallet: vi.fn(),
  findAuthorProfilesByIds: vi.fn(),
  findSubscriptionPlanById: vi.fn(),
}));

const profileMocks = vi.hoisted(() => ({
  getAuthorProfileBySlug: vi.fn(),
}));

const onchainMocks = vi.hoisted(() => ({
  verifySubscriptionPayment: vi.fn(),
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
  }

  return { APIError: MockAPIError };
});

vi.mock("./repository", () => repositoryMocks);
vi.mock("../access/repository", () => repositoryMocks);
vi.mock("../platform/repository", () => repositoryMocks);
vi.mock("../posts/repository", () => repositoryMocks);
vi.mock("../projects/repository", () => repositoryMocks);
vi.mock("../profiles/repository", () => repositoryMocks);
vi.mock("../lib/contract-deployments.repository", () => repositoryMocks);
vi.mock("../profiles/service", () => profileMocks);
vi.mock("../activity/events", () => ({
  recordNewSubscriptionActivity: vi.fn(),
}));
vi.mock("../onchain", () => ({
  readOnChainAccessGrants: vi.fn(),
  verifyPlatformSubscriptionPayment: vi.fn(),
  verifyPlanRegistration: vi.fn(),
  verifySubscriptionPayment: onchainMocks.verifySubscriptionPayment,
}));
vi.mock("../posts/file-storage", () => ({
  readPostAttachmentFile: vi.fn(),
}));
vi.mock("../projects/file-storage", () => ({
  readProjectFile: vi.fn(),
}));

import {
  confirmSubscriptionPayment,
  createSubscriptionPaymentIntent,
  listMyReaderSubscriptions,
} from "./service";

describe("subscriptions/service", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  test("creates a subscription intent with generated plan key", async () => {
    const author = createAuthorProfileDoc();
    vi.mocked(profileMocks.getAuthorProfileBySlug).mockResolvedValue(author);
    vi.mocked(repositoryMocks.findSubscriptionPlanByAuthorIdAndCode)
      .mockResolvedValue({
        _id: new ObjectId("65f111111111111111111111"),
        authorId: author._id,
        code: "main",
        title: "Main",
        paymentAsset: "erc20",
        chainId: 11155111,
        tokenAddress: "0xtoken000000000000000000000000000000000000",
        price: "1000000",
        billingPeriodDays: 30,
        contractAddress: "0xmanager0000000000000000000000000000000000",
        planKey: null,
        registrationTxHash: null,
        active: true,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      });
    vi.mocked(repositoryMocks.createSubscriptionPaymentIntent)
      .mockImplementation(async (doc) => ({
        _id: new ObjectId("65f222222222222222222222"),
        ...doc,
      }));

    const intent = await createSubscriptionPaymentIntent(
      "0xabc0000000000000000000000000000000000000",
      author.slug,
      { planCode: "main" },
    );

    expect(intent.planCode).toBe("main");
    expect(intent.planKey).toMatch(/^0x[a-f0-9]{64}$/);
    expect(intent.status).toBe("pending");
  });

  test("rejects missing or inactive plan when creating intent", async () => {
    vi.mocked(profileMocks.getAuthorProfileBySlug).mockResolvedValue(
      createAuthorProfileDoc(),
    );
    vi.mocked(repositoryMocks.findSubscriptionPlanByAuthorIdAndCode)
      .mockResolvedValue(null);

    await expect(
      createSubscriptionPaymentIntent(
        "0xabc0000000000000000000000000000000000000",
        "kamil",
        { planCode: "main" },
      ),
    ).rejects.toThrowError("subscription plan not found");
  });

  test("returns confirmed intent idempotently", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-01T00:05:00.000Z"));
    const intent = {
      _id: new ObjectId("65f333333333333333333333"),
      authorId: new ObjectId("65f000000000000000000001"),
      subscriberWallet: "0xabc0000000000000000000000000000000000000",
      planId: new ObjectId("65f111111111111111111111"),
      planCode: "main",
      planKey: "0x" + "1".repeat(64),
      paymentAsset: "erc20" as const,
      chainId: 11155111,
      tokenAddress: "0xtoken000000000000000000000000000000000000",
      contractAddress: "0xmanager0000000000000000000000000000000000",
      price: "1000000",
      billingPeriodDays: 30,
      status: "confirmed" as const,
      txHash: "0x" + "2".repeat(64),
      entitlementId: new ObjectId("65f444444444444444444444"),
      paidUntil: new Date("2026-05-01T00:00:00.000Z"),
      expiresAt: new Date("2026-04-01T00:30:00.000Z"),
      createdAt: new Date("2026-04-01T00:00:00.000Z"),
      updatedAt: new Date("2026-04-01T00:00:00.000Z"),
    };
    vi.mocked(repositoryMocks.findSubscriptionPaymentIntentByIdAndWallet)
      .mockResolvedValue(intent);

    await expect(
      confirmSubscriptionPayment(intent.subscriberWallet, intent._id.toHexString(), {
        txHash: "0x" + "2".repeat(64),
      }),
    ).resolves.toBe(intent);
  });

  test("marks expired intent before confirmation", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-01T01:00:00.000Z"));
    const intent = {
      _id: new ObjectId("65f333333333333333333333"),
      authorId: new ObjectId("65f000000000000000000001"),
      subscriberWallet: "0xabc0000000000000000000000000000000000000",
      planId: new ObjectId("65f111111111111111111111"),
      planCode: "main",
      planKey: "0x" + "1".repeat(64),
      paymentAsset: "erc20" as const,
      chainId: 11155111,
      tokenAddress: "0xtoken000000000000000000000000000000000000",
      contractAddress: "0xmanager0000000000000000000000000000000000",
      price: "1000000",
      billingPeriodDays: 30,
      status: "pending" as const,
      txHash: null,
      entitlementId: null,
      paidUntil: null,
      expiresAt: new Date("2026-04-01T00:30:00.000Z"),
      createdAt: new Date("2026-04-01T00:00:00.000Z"),
      updatedAt: new Date("2026-04-01T00:00:00.000Z"),
    };
    vi.mocked(repositoryMocks.findSubscriptionPaymentIntentByIdAndWallet)
      .mockResolvedValue(intent);
    vi.mocked(repositoryMocks.updateSubscriptionPaymentIntent)
      .mockImplementation(async (_id, update) => ({ ...intent, ...update }));

    const updated = await confirmSubscriptionPayment(
      intent.subscriberWallet,
      intent._id.toHexString(),
      { txHash: "0x" + "3".repeat(64) },
    );

    expect(updated.status).toBe("expired");
  });

  test("rejects transaction hash already attached to another payment", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-01T00:05:00.000Z"));
    const intent = {
      _id: new ObjectId("65f333333333333333333333"),
      authorId: new ObjectId("65f000000000000000000001"),
      subscriberWallet: "0xabc0000000000000000000000000000000000000",
      planId: new ObjectId("65f111111111111111111111"),
      planCode: "main",
      planKey: "0x" + "1".repeat(64),
      paymentAsset: "erc20" as const,
      chainId: 11155111,
      tokenAddress: "0xtoken000000000000000000000000000000000000",
      contractAddress: "0xmanager0000000000000000000000000000000000",
      price: "1000000",
      billingPeriodDays: 30,
      status: "pending" as const,
      txHash: null,
      entitlementId: null,
      paidUntil: null,
      expiresAt: new Date("2026-04-01T00:30:00.000Z"),
      createdAt: new Date("2026-04-01T00:00:00.000Z"),
      updatedAt: new Date("2026-04-01T00:00:00.000Z"),
    };
    vi.mocked(repositoryMocks.findSubscriptionPaymentIntentByIdAndWallet)
      .mockResolvedValue(intent);
    vi.mocked(repositoryMocks.findSubscriptionPaymentIntentByTxHash)
      .mockResolvedValue({
        ...intent,
        _id: new ObjectId("65f999999999999999999999"),
      });

    await expect(
      confirmSubscriptionPayment(intent.subscriberWallet, intent._id.toHexString(), {
        txHash: "0x" + "3".repeat(64),
      }),
    ).rejects.toThrowError("transaction hash is already attached to payment");
  });

  test("confirms subscription payment and upserts entitlement", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-01T00:05:00.000Z"));
    const intent = {
      _id: new ObjectId("65f333333333333333333333"),
      authorId: new ObjectId("65f000000000000000000001"),
      subscriberWallet: "0xabc0000000000000000000000000000000000000",
      planId: new ObjectId("65f111111111111111111111"),
      planCode: "main",
      planKey: "0x" + "1".repeat(64),
      paymentAsset: "erc20" as const,
      chainId: 11155111,
      tokenAddress: "0xtoken000000000000000000000000000000000000",
      contractAddress: "0xmanager0000000000000000000000000000000000",
      price: "1000000",
      billingPeriodDays: 30,
      status: "pending" as const,
      txHash: null,
      entitlementId: null,
      paidUntil: null,
      expiresAt: new Date("2026-04-01T00:30:00.000Z"),
      createdAt: new Date("2026-04-01T00:00:00.000Z"),
      updatedAt: new Date("2026-04-01T00:00:00.000Z"),
    };
    vi.mocked(repositoryMocks.findSubscriptionPaymentIntentByIdAndWallet)
      .mockResolvedValue(intent);
    vi.mocked(repositoryMocks.findSubscriptionPaymentIntentByTxHash)
      .mockResolvedValue(null);
    vi.mocked(onchainMocks.verifySubscriptionPayment).mockResolvedValue({
      paidUntil: new Date("2026-05-01T00:00:00.000Z"),
    });
    vi.mocked(repositoryMocks.upsertActiveSubscriptionEntitlement)
      .mockResolvedValue({
        _id: new ObjectId("65f444444444444444444444"),
      });
    vi.mocked(repositoryMocks.updateSubscriptionPaymentIntent)
      .mockImplementation(async (_id, update) => ({ ...intent, ...update }));

    const updated = await confirmSubscriptionPayment(
      intent.subscriberWallet,
      intent._id.toHexString(),
      { txHash: "0x" + "4".repeat(64) },
    );

    expect(updated.status).toBe("confirmed");
    expect(
      repositoryMocks.upsertActiveSubscriptionEntitlement,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        authorId: intent.authorId,
        subscriberWallet: intent.subscriberWallet,
        planId: intent.planId,
        validUntil: new Date("2026-05-01T00:00:00.000Z"),
        now: new Date("2026-04-01T00:05:00.000Z"),
      }),
    );
  });

  test("enriches reader subscriptions with author and plan info", async () => {
    const author = createAuthorProfileDoc();
    const planId = new ObjectId("65f111111111111111111111");
    vi.mocked(repositoryMocks.listSubscriptionEntitlementsByWallet)
      .mockResolvedValue([
        {
          _id: new ObjectId("65f555555555555555555555"),
          authorId: author._id,
          subscriberWallet: "0xabc0000000000000000000000000000000000000",
          planId,
          status: "active",
          validUntil: new Date("2026-05-01T00:00:00.000Z"),
          createdAt: new Date("2026-04-01T00:00:00.000Z"),
          updatedAt: new Date("2026-04-01T00:00:00.000Z"),
        },
      ]);
    vi.mocked(repositoryMocks.findAuthorProfilesByIds).mockResolvedValue([
      author,
    ]);
    vi.mocked(repositoryMocks.findSubscriptionPlanById).mockResolvedValue({
      _id: planId,
      authorId: author._id,
      code: "main",
      title: "Main",
      paymentAsset: "erc20",
      chainId: 11155111,
      tokenAddress: "0xtoken000000000000000000000000000000000000",
      price: "1000000",
      billingPeriodDays: 30,
      contractAddress: "0xmanager0000000000000000000000000000000000",
      planKey: null,
      registrationTxHash: null,
      active: true,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const subscriptions = await listMyReaderSubscriptions(
      "0xabc0000000000000000000000000000000000000",
    );

    expect(subscriptions).toHaveLength(1);
    expect(subscriptions[0]).toMatchObject({
      authorSlug: author.slug,
      planCode: "main",
      planTitle: "Main",
    });
  });
});
