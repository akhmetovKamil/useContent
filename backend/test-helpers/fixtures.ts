import { ObjectId } from "mongodb";
import type { AuthorProfileDoc, UserDoc } from "../profiles/doc-types";
import type { ProjectDoc, ProjectNodeDoc } from "../projects/doc-types";

export function createAuthorProfileDoc(
  overrides: Partial<AuthorProfileDoc> = {},
): AuthorProfileDoc {
  return {
    _id: new ObjectId("65f000000000000000000001"),
    userId: "65f000000000000000000099",
    slug: "kamil",
    displayName: "Kamil",
    bio: "",
    tags: [],
    socialLinks: [],
    avatarFileId: null,
    defaultPolicy: {
      version: 1,
      root: { type: "public" },
    },
    defaultPolicyId: null,
    subscriptionPlanId: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

export function createUserDoc(overrides: Partial<UserDoc> = {}): UserDoc {
  return {
    _id: new ObjectId("65f000000000000000000099"),
    username: null,
    displayName: "Kamil",
    bio: "",
    avatarFileId: null,
    primaryWallet: "0xabc0000000000000000000000000000000000000",
    wallets: [],
    role: "user",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

export function createProjectDoc(
  overrides: Partial<ProjectDoc> = {},
): ProjectDoc {
  const _id = overrides._id ?? new ObjectId("65f000000000000000000010");
  const rootNodeId =
    overrides.rootNodeId ?? new ObjectId("65f000000000000000000011");

  return {
    _id,
    authorId:
      overrides.authorId ?? new ObjectId("65f000000000000000000001"),
    title: "Project",
    description: "",
    status: "draft",
    policyMode: "inherited",
    policy: {
      version: 1,
      root: { type: "public" },
    },
    accessPolicyId: null,
    rootNodeId,
    publishedAt: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

export function createProjectNodeDoc(
  overrides: Partial<ProjectNodeDoc> = {},
): ProjectNodeDoc {
  return {
    _id: new ObjectId("65f000000000000000000012"),
    authorId:
      overrides.authorId ?? new ObjectId("65f000000000000000000001"),
    projectId:
      overrides.projectId ?? new ObjectId("65f000000000000000000010"),
    parentId: null,
    kind: "folder",
    name: "Project",
    storageKey: null,
    mimeType: null,
    size: null,
    visibility: "published",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}
