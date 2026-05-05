import { ObjectId } from "mongodb";
import { afterEach, describe, expect, test, vi } from "vitest";
import { SUBSCRIPTION_ENTITLEMENT_SOURCE } from "../../shared/consts";
import { createAuthorProfileDoc } from "../test-helpers/fixtures";

const repositoryMocks = vi.hoisted(() => ({
  findSubscriptionPlanByAuthorIdAndCode: vi.fn(),
  createSubscriptionPaymentIntent: vi.fn(),
  findSubscriptionPaymentIntentByIdAndWallet: vi.fn(),
  updateSubscriptionPaymentIntent: vi.fn(),
  findSubscriptionPaymentIntentByTxHash: vi.fn(),
  upsertActiveSubscriptionEntitlement: vi.fn(),
  listSubscriptionEntitlementsByWallet: vi.fn(),
  listSubscriptionEntitlementsByAuthorId: vi.fn(),
  findAuthorProfilesByIds: vi.fn(),
  findSubscriptionPlanById: vi.fn(),
  listSubscriptionPlansByAuthorId: vi.fn(),
  listAccessPolicyPresetsByAuthorId: vi.fn(),
  findUserByPrimaryWallet: vi.fn(),
  listConfirmedSubscriptionPaymentIntentsByWallet: vi.fn(),
  listConfirmedSubscriptionPaymentIntentsByAuthorId: vi.fn(),
  countPostsByAuthorId: vi.fn(),
  countProjectsByAuthorId: vi.fn(),
}));

const profileMocks = vi.hoisted(() => ({
  getAuthorProfileBySlug: vi.fn(),
  getMyAuthorProfile: vi.fn(),
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
vi.mock("../contracts/repository", () => repositoryMocks);
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
  getMyAuthorDashboard,
  getMyReaderDashboard,
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
          source: SUBSCRIPTION_ENTITLEMENT_SOURCE.ONCHAIN,
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
    vi.mocked(repositoryMocks.listConfirmedSubscriptionPaymentIntentsByWallet)
      .mockResolvedValue([]);

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

  test("aggregates reader dashboard spend and expirations by asset", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-10T00:00:00.000Z"));
    const author = createAuthorProfileDoc();
    const activePlanId = new ObjectId("65f111111111111111111111");
    const expiredPlanId = new ObjectId("65f222222222222222222222");
    const wallet = "0xabc0000000000000000000000000000000000000";

    vi.mocked(repositoryMocks.listSubscriptionEntitlementsByWallet)
      .mockResolvedValue([
        {
          _id: new ObjectId("65f555555555555555555555"),
          authorId: author._id,
          subscriberWallet: wallet,
          planId: activePlanId,
          status: "active",
          source: SUBSCRIPTION_ENTITLEMENT_SOURCE.ONCHAIN,
          validUntil: new Date("2026-04-20T00:00:00.000Z"),
          createdAt: new Date("2026-04-01T00:00:00.000Z"),
          updatedAt: new Date("2026-04-01T00:00:00.000Z"),
        },
        {
          _id: new ObjectId("65f666666666666666666666"),
          authorId: author._id,
          subscriberWallet: wallet,
          planId: expiredPlanId,
          status: "expired",
          source: SUBSCRIPTION_ENTITLEMENT_SOURCE.ONCHAIN,
          validUntil: new Date("2026-03-20T00:00:00.000Z"),
          createdAt: new Date("2026-03-01T00:00:00.000Z"),
          updatedAt: new Date("2026-03-01T00:00:00.000Z"),
        },
      ]);
    vi.mocked(repositoryMocks.findAuthorProfilesByIds).mockResolvedValue([
      author,
    ]);
    vi.mocked(repositoryMocks.findSubscriptionPlanById)
      .mockImplementation(async (planId) =>
        createPlan({
          _id: planId,
          authorId: author._id,
          code: planId.equals(activePlanId) ? "main" : "plus",
          title: planId.equals(activePlanId) ? "Main" : "Plus",
          price: planId.equals(activePlanId) ? "1000" : "2000",
        }),
      );
    vi.mocked(repositoryMocks.listConfirmedSubscriptionPaymentIntentsByWallet)
      .mockResolvedValue([
        createPayment({
          _id: new ObjectId("65f777777777777777777777"),
          authorId: author._id,
          subscriberWallet: wallet,
          planId: activePlanId,
          price: "1000",
        }),
        createPayment({
          _id: new ObjectId("65f888888888888888888888"),
          authorId: author._id,
          subscriberWallet: wallet,
          planId: expiredPlanId,
          price: "2000",
        }),
      ]);

    const dashboard = await getMyReaderDashboard(wallet);

    expect(dashboard.counts).toMatchObject({
      activeSubscriptions: 1,
      expiredSubscriptions: 1,
      paidAuthors: 1,
      expiringSoon: 1,
    });
    expect(dashboard.spendByAsset).toEqual([
      expect.objectContaining({
        grossAmount: "3000",
        netAmount: "2400",
        platformFeeAmount: "600",
        confirmedPayments: 2,
      }),
    ]);
    expect(dashboard.upcomingExpirations).toHaveLength(1);
  });

  test("aggregates author dashboard subscribers, active revenue, and series", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-10T00:00:00.000Z"));
    const author = createAuthorProfileDoc();
    const mainPlan = createPlan({
      _id: new ObjectId("65f111111111111111111111"),
      authorId: author._id,
      code: "main",
      title: "Main",
      price: "1000",
    });
    const plusPlan = createPlan({
      _id: new ObjectId("65f222222222222222222222"),
      authorId: author._id,
      code: "plus",
      title: "Plus",
      price: "2000",
    });
    const activeEntitlement = {
      _id: new ObjectId("65f555555555555555555555"),
      authorId: author._id,
      subscriberWallet: "0xabc0000000000000000000000000000000000000",
      planId: mainPlan._id,
      status: "active" as const,
      source: SUBSCRIPTION_ENTITLEMENT_SOURCE.ONCHAIN,
      validUntil: new Date("2026-05-01T00:00:00.000Z"),
      createdAt: new Date("2026-04-01T00:00:00.000Z"),
      updatedAt: new Date("2026-04-01T00:00:00.000Z"),
    };
    const expiredEntitlement = {
      _id: new ObjectId("65f666666666666666666666"),
      authorId: author._id,
      subscriberWallet: "0xdef0000000000000000000000000000000000000",
      planId: plusPlan._id,
      status: "expired" as const,
      source: SUBSCRIPTION_ENTITLEMENT_SOURCE.ONCHAIN,
      validUntil: new Date("2026-03-01T00:00:00.000Z"),
      createdAt: new Date("2026-03-01T00:00:00.000Z"),
      updatedAt: new Date("2026-03-01T00:00:00.000Z"),
    };

    vi.mocked(profileMocks.getMyAuthorProfile).mockResolvedValue(author);
    vi.mocked(repositoryMocks.listSubscriptionEntitlementsByAuthorId)
      .mockResolvedValue([activeEntitlement, expiredEntitlement]);
    vi.mocked(repositoryMocks.listSubscriptionPlansByAuthorId)
      .mockResolvedValue([mainPlan, plusPlan]);
    vi.mocked(repositoryMocks.listAccessPolicyPresetsByAuthorId)
      .mockResolvedValue([]);
    vi.mocked(repositoryMocks.findUserByPrimaryWallet).mockResolvedValue(null);
    vi.mocked(repositoryMocks.listConfirmedSubscriptionPaymentIntentsByAuthorId)
      .mockResolvedValue([
        createPayment({
          _id: new ObjectId("65f777777777777777777777"),
          authorId: author._id,
          subscriberWallet: activeEntitlement.subscriberWallet,
          planId: mainPlan._id,
          price: "1000",
          updatedAt: new Date("2026-04-03T00:00:00.000Z"),
        }),
        createPayment({
          _id: new ObjectId("65f888888888888888888888"),
          authorId: author._id,
          subscriberWallet: expiredEntitlement.subscriberWallet,
          planId: plusPlan._id,
          price: "2000",
          updatedAt: new Date("2026-03-03T00:00:00.000Z"),
        }),
      ]);
    vi.mocked(repositoryMocks.countPostsByAuthorId).mockResolvedValue(7);
    vi.mocked(repositoryMocks.countProjectsByAuthorId).mockResolvedValue(2);

    const dashboard = await getMyAuthorDashboard(
      "0xabc0000000000000000000000000000000000000",
    );

    expect(dashboard.counts).toMatchObject({
      posts: 7,
      projects: 2,
      uniqueSubscribers: 2,
      activeSubscribers: 1,
      expiredSubscribers: 1,
    });
    expect(dashboard.activeRevenueByAsset).toEqual([
      expect.objectContaining({
        grossAmount: "1000",
        netAmount: "800",
        platformFeeAmount: "200",
        confirmedPayments: 1,
      }),
    ]);
    expect(dashboard.planBreakdown).toEqual([
      expect.objectContaining({
        planCode: "main",
        activeSubscribers: 1,
        expiredSubscribers: 0,
      }),
      expect.objectContaining({
        planCode: "plus",
        activeSubscribers: 0,
        expiredSubscribers: 1,
      }),
    ]);
    expect(dashboard.revenueSeries.month).toEqual([
      expect.objectContaining({ period: "2026-04-03" }),
    ]);
    expect(dashboard.revenueSeries.year).toEqual([
      expect.objectContaining({ period: "2026-03" }),
      expect.objectContaining({ period: "2026-04" }),
    ]);
    expect(dashboard.recentSubscribers).toHaveLength(2);
  });
});

function createPlan(overrides: Record<string, unknown> = {}) {
  return {
    _id: new ObjectId("65f111111111111111111111"),
    authorId: new ObjectId("65f000000000000000000001"),
    code: "main",
    title: "Main",
    paymentAsset: "erc20",
    chainId: 11155111,
    tokenAddress: "0xtoken000000000000000000000000000000000000",
    price: "1000",
    billingPeriodDays: 30,
    contractAddress: "0xmanager0000000000000000000000000000000000",
    planKey: "0x" + "1".repeat(64),
    registrationTxHash: null,
    active: true,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

function createPayment(overrides: Record<string, unknown> = {}) {
  return {
    _id: new ObjectId("65f777777777777777777777"),
    authorId: new ObjectId("65f000000000000000000001"),
    subscriberWallet: "0xabc0000000000000000000000000000000000000",
    planId: new ObjectId("65f111111111111111111111"),
    planCode: "main",
    planKey: "0x" + "1".repeat(64),
    paymentAsset: "erc20",
    chainId: 11155111,
    tokenAddress: "0xtoken000000000000000000000000000000000000",
    contractAddress: "0xmanager0000000000000000000000000000000000",
    price: "1000",
    billingPeriodDays: 30,
    status: "confirmed",
    txHash: "0x" + "2".repeat(64),
    entitlementId: new ObjectId("65f555555555555555555555"),
    paidUntil: new Date("2026-05-01T00:00:00.000Z"),
    expiresAt: new Date("2026-04-01T00:30:00.000Z"),
    createdAt: new Date("2026-04-01T00:00:00.000Z"),
    updatedAt: new Date("2026-04-01T00:00:00.000Z"),
    ...overrides,
  };
}
