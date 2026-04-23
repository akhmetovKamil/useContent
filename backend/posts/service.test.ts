import { ObjectId } from "mongodb";
import { afterEach, describe, expect, test, vi } from "vitest";
import { createAuthorProfileDoc } from "../test-helpers/fixtures";

const repositoryMocks = vi.hoisted(() => ({
  createPost: vi.fn(),
  findPostByIdAndAuthorId: vi.fn(),
  updatePost: vi.fn(),
  deletePost: vi.fn(),
  deletePostAttachmentsByPostId: vi.fn(),
  deletePostCommentsByPostId: vi.fn(),
  createPostAttachment: vi.fn(),
  appendPostAttachmentId: vi.fn(),
}));

const profileMocks = vi.hoisted(() => ({
  getMyAuthorProfile: vi.fn(),
  getAuthorProfileBySlug: vi.fn(),
  getOrCreateUserByWallet: vi.fn(),
}));

const platformMocks = vi.hoisted(() => ({
  assertAuthorStorageQuota: vi.fn(),
}));

const fileStorageMocks = vi.hoisted(() => ({
  createPostAttachmentStorageKey: vi.fn(),
  deletePostAttachmentFile: vi.fn(),
  uploadPostAttachmentFile: vi.fn(),
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

    static internal(message: string) {
      return new MockAPIError(message);
    }
  }

  return { APIError: MockAPIError };
});

vi.mock("./repository", () => repositoryMocks);
vi.mock("../access/repository", () => repositoryMocks);
vi.mock("../platform/repository", () => repositoryMocks);
vi.mock("../subscriptions/repository", () => repositoryMocks);
vi.mock("../projects/repository", () => repositoryMocks);
vi.mock("../profiles/repository", () => repositoryMocks);
vi.mock("../lib/contract-deployments.repository", () => repositoryMocks);
vi.mock("../profiles/service", () => profileMocks);
vi.mock("../platform/service", () => platformMocks);
vi.mock("../subscriptions/service", () => ({
  listMyEntitlements: vi.fn(),
}));
vi.mock("../content/onchain", () => ({
  readOnChainAccessGrants: vi.fn(),
  verifyPlatformSubscriptionPayment: vi.fn(),
  verifyPlanRegistration: vi.fn(),
  verifySubscriptionPayment: vi.fn(),
}));
vi.mock("./file-storage", () => fileStorageMocks);
vi.mock("../projects/file-storage", () => ({
  readProjectFile: vi.fn(),
}));

import {
  createMyPost,
  deleteMyPost,
  updateMyPost,
  uploadMyPostAttachment,
} from "./service";

describe("posts/service", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  test("creates a published post with publishedAt", async () => {
    const author = createAuthorProfileDoc();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-01T00:00:00.000Z"));
    vi.mocked(profileMocks.getMyAuthorProfile).mockResolvedValue(author);
    vi.mocked(repositoryMocks.createPost).mockImplementation(async (doc) => ({
      _id: new ObjectId("65f101010101010101010101"),
      ...doc,
    }));

    const post = await createMyPost(author.slug, {
      title: "Published post",
      content: "Hello world",
      status: "published",
    });

    expect(post.status).toBe("published");
    expect(post.publishedAt).toEqual(new Date("2026-04-01T00:00:00.000Z"));
  });

  test("updates draft post to published and preserves author policy when omitted", async () => {
    const author = createAuthorProfileDoc();
    const existing = {
      _id: new ObjectId("65f202020202020202020202"),
      authorId: author._id,
      title: "Draft",
      content: "Text",
      status: "draft" as const,
      policyMode: "inherited" as const,
      policy: author.defaultPolicy,
      accessPolicyId: null,
      attachmentIds: [],
      linkedProjectIds: [],
      publishedAt: null,
      createdAt: new Date("2026-04-01T00:00:00.000Z"),
      updatedAt: new Date("2026-04-01T00:00:00.000Z"),
    };
    vi.mocked(profileMocks.getMyAuthorProfile).mockResolvedValue(author);
    vi.mocked(repositoryMocks.findPostByIdAndAuthorId).mockResolvedValue(
      existing,
    );
    vi.mocked(repositoryMocks.updatePost).mockImplementation(async (_id, _authorId, update) => ({
      ...existing,
      ...update,
    }));

    const post = await updateMyPost(author.slug, existing._id.toHexString(), {
      status: "published",
    });

    expect(post.status).toBe("published");
    expect(post.publishedAt).toBeInstanceOf(Date);
    expect(post.policy).toEqual(author.defaultPolicy);
  });

  test("deletes post attachments and comments", async () => {
    const author = createAuthorProfileDoc();
    const postId = new ObjectId("65f303030303030303030303");
    vi.mocked(profileMocks.getMyAuthorProfile).mockResolvedValue(author);
    vi.mocked(repositoryMocks.deletePost).mockResolvedValue(true);
    vi.mocked(repositoryMocks.deletePostAttachmentsByPostId).mockResolvedValue([
      { storageKey: "post/one" },
      { storageKey: "post/two" },
    ]);
    vi.mocked(repositoryMocks.deletePostCommentsByPostId).mockResolvedValue(
      undefined,
    );

    await deleteMyPost(author.slug, postId.toHexString());

    expect(fileStorageMocks.deletePostAttachmentFile).toHaveBeenCalledTimes(2);
    expect(repositoryMocks.deletePostCommentsByPostId).toHaveBeenCalledWith(
      postId,
    );
  });

  test("uploads post attachment and appends attachment id", async () => {
    const author = createAuthorProfileDoc();
    const postId = new ObjectId("65f404040404040404040404");
    const post = {
      _id: postId,
      authorId: author._id,
    };
    vi.mocked(profileMocks.getMyAuthorProfile).mockResolvedValue(author);
    vi.mocked(repositoryMocks.findPostByIdAndAuthorId).mockResolvedValue(post);
    vi.mocked(fileStorageMocks.createPostAttachmentStorageKey)
      .mockReturnValue("authors/a/posts/p/attachments/att/image.png");
    vi.mocked(repositoryMocks.createPostAttachment).mockImplementation(
      async (doc) => doc,
    );
    vi.mocked(repositoryMocks.appendPostAttachmentId).mockResolvedValue(true);

    const attachment = await uploadMyPostAttachment(
      author.slug,
      postId.toHexString(),
      {
        name: "image.png",
        body: Buffer.from("hello"),
        contentType: "image/png",
      },
    );

    expect(platformMocks.assertAuthorStorageQuota).toHaveBeenCalledWith(
      author,
      5,
    );
    expect(fileStorageMocks.uploadPostAttachmentFile).toHaveBeenCalledWith(
      "authors/a/posts/p/attachments/att/image.png",
      expect.any(Buffer),
      "image/png",
    );
    expect(attachment.storageKey).toBe(
      "authors/a/posts/p/attachments/att/image.png",
    );
  });
});
