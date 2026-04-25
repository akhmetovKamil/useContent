import { ObjectId } from "mongodb";
import { afterEach, describe, expect, test, vi } from "vitest";

const repositoryMocks = vi.hoisted(() => ({
  listActivitiesByWalletPage: vi.fn(),
}));

vi.mock("encore.dev/api", () => {
  class MockAPIError extends Error {
    static invalidArgument(message: string) {
      return new MockAPIError(message);
    }
  }

  return { APIError: MockAPIError };
});

vi.mock("../lib/content-common", () => ({
  normalizeWallet: (wallet: string) => wallet.toLowerCase(),
}));
vi.mock("./repository", () => repositoryMocks);

import { listMyActivity } from "./service";

describe("activity/service", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  test("returns paginated activity with next cursor", async () => {
    const createdAt = new Date("2026-04-24T10:00:00.000Z");
    vi.mocked(repositoryMocks.listActivitiesByWalletPage).mockResolvedValue([
      createActivityDoc("65f111111111111111111111", createdAt),
      createActivityDoc("65f222222222222222222222", new Date("2026-04-24T09:00:00.000Z")),
    ]);

    const page = await listMyActivity("0xABC", { limit: 1 });

    expect(repositoryMocks.listActivitiesByWalletPage).toHaveBeenCalledWith({
      targetWallet: "0xabc",
      cursor: null,
      limit: 2,
    });
    expect(page.items).toHaveLength(1);
    expect(page.hasMore).toBe(true);
    expect(page.nextCursor).toEqual(expect.any(String));
  });

  test("rejects invalid cursor", async () => {
    await expect(listMyActivity("0xABC", { cursor: "not-base64" })).rejects.toThrow(
      "activity cursor is invalid",
    );
  });
});

function createActivityDoc(id: string, createdAt: Date) {
  return {
    _id: new ObjectId(id),
    type: "post_liked" as const,
    targetWallet: "0xabc",
    actorWallet: "0xdef",
    authorId: new ObjectId("65f333333333333333333333"),
    authorSlug: "kamil",
    authorDisplayName: "Kamil",
    postId: new ObjectId("65f444444444444444444444"),
    postTitle: "Hello",
    message: "0xdef liked \"Hello\".",
    dedupeKey: null,
    createdAt,
    readAt: null,
  };
}
