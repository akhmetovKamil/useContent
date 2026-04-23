import { ObjectId } from "mongodb";
import { afterEach, describe, expect, test, vi } from "vitest";
import {
  createAuthorProfileDoc,
  createProjectDoc,
  createProjectNodeDoc,
} from "../test-helpers/fixtures";

const repositoryMocks = vi.hoisted(() => ({
  createProjectNode: vi.fn(),
  createProject: vi.fn(),
  findProjectByIdAndAuthorId: vi.fn(),
  updateProject: vi.fn(),
  updateProjectNode: vi.fn(),
  listProjectNodesByProjectId: vi.fn(),
  deleteProjectNodesByProjectId: vi.fn(),
  deleteProject: vi.fn(),
}));

const profileMocks = vi.hoisted(() => ({
  getMyAuthorProfile: vi.fn(),
  getAuthorProfileBySlug: vi.fn(),
  getOrCreateUserByWallet: vi.fn(),
}));

const platformMocks = vi.hoisted(() => ({
  assertAuthorPlatformFeature: vi.fn(),
  assertAuthorStorageQuota: vi.fn(),
}));

const fileStorageMocks = vi.hoisted(() => ({
  createProjectFileStorageKey: vi.fn(),
  deleteProjectFile: vi.fn(),
  uploadProjectFile: vi.fn(),
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
vi.mock("../posts/repository", () => repositoryMocks);
vi.mock("../profiles/repository", () => repositoryMocks);
vi.mock("../lib/contract-deployments.repository", () => repositoryMocks);
vi.mock("../profiles/service", () => profileMocks);
vi.mock("../platform/service", () => platformMocks);
vi.mock("../content/onchain", () => ({
  readOnChainAccessGrants: vi.fn(),
  verifyPlatformSubscriptionPayment: vi.fn(),
  verifyPlanRegistration: vi.fn(),
  verifySubscriptionPayment: vi.fn(),
}));
vi.mock("./file-storage", () => fileStorageMocks);
vi.mock("../posts/file-storage", () => ({
  readPostAttachmentFile: vi.fn(),
}));

import { createMyProject, deleteMyProject, updateMyProject } from "./service";

describe("projects/service", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  test("creates project with matching root node", async () => {
    const author = createAuthorProfileDoc();
    vi.mocked(profileMocks.getMyAuthorProfile).mockResolvedValue(author);
    vi.mocked(repositoryMocks.createProjectNode).mockImplementation(
      async (doc) => doc,
    );
    vi.mocked(repositoryMocks.createProject).mockImplementation(async (doc) => ({
      ...doc,
      rootNodeId: doc.rootNodeId,
    }));

    const project = await createMyProject(author.slug, {
      title: "Main project",
      description: "Docs",
      status: "published",
    });

    expect(platformMocks.assertAuthorPlatformFeature).toHaveBeenCalledWith(
      author,
      "projects",
    );
    expect(project.status).toBe("published");
    expect(project.publishedAt).toBeInstanceOf(Date);
  });

  test("fails when created project root node does not match", async () => {
    const author = createAuthorProfileDoc();
    vi.mocked(profileMocks.getMyAuthorProfile).mockResolvedValue(author);
    vi.mocked(repositoryMocks.createProjectNode).mockResolvedValue(
      createProjectNodeDoc(),
    );
    vi.mocked(repositoryMocks.createProject).mockResolvedValue(
      createProjectDoc({
        rootNodeId: new ObjectId("65f505050505050505050505"),
      }),
    );

    await expect(
      createMyProject(author.slug, {
        title: "Broken project",
      }),
    ).rejects.toThrowError("project root node mismatch");
  });

  test("renames root node when project title changes", async () => {
    const author = createAuthorProfileDoc();
    const project = createProjectDoc();
    vi.mocked(profileMocks.getMyAuthorProfile).mockResolvedValue(author);
    vi.mocked(repositoryMocks.findProjectByIdAndAuthorId).mockResolvedValue(
      project,
    );
    vi.mocked(repositoryMocks.updateProject).mockImplementation(async (_id, _authorId, update) => ({
      ...project,
      ...update,
    }));
    vi.mocked(repositoryMocks.updateProjectNode).mockResolvedValue(
      createProjectNodeDoc({ _id: project.rootNodeId, projectId: project._id }),
    );

    const updated = await updateMyProject(author.slug, project._id.toHexString(), {
      title: "Renamed project",
    });

    expect(updated.title).toBe("Renamed project");
    expect(repositoryMocks.updateProjectNode).toHaveBeenCalledWith(
      project.rootNodeId,
      project._id,
      expect.objectContaining({ name: "Renamed project" }),
    );
  });

  test("deletes file nodes before removing project", async () => {
    const author = createAuthorProfileDoc();
    const project = createProjectDoc();
    vi.mocked(profileMocks.getMyAuthorProfile).mockResolvedValue(author);
    vi.mocked(repositoryMocks.findProjectByIdAndAuthorId).mockResolvedValue(
      project,
    );
    vi.mocked(repositoryMocks.listProjectNodesByProjectId).mockResolvedValue([
      createProjectNodeDoc({
        _id: new ObjectId("65f606060606060606060606"),
        kind: "file",
        projectId: project._id,
        storageKey: "authors/a/projects/p/file.txt",
        size: 128,
      }),
    ]);
    vi.mocked(repositoryMocks.deleteProjectNodesByProjectId).mockResolvedValue(
      true,
    );
    vi.mocked(repositoryMocks.deleteProject).mockResolvedValue(true);

    await deleteMyProject(author.slug, project._id.toHexString());

    expect(fileStorageMocks.deleteProjectFile).toHaveBeenCalledWith(
      "authors/a/projects/p/file.txt",
    );
    expect(repositoryMocks.deleteProjectNodesByProjectId).toHaveBeenCalledWith(
      project._id,
    );
  });
});
