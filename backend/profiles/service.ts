import { APIError } from "encore.dev/api";
import { ObjectId } from "mongodb";
import { shortenWalletAddress } from "../../shared/utils/web3";
import * as accessRepo from "../access/repository";
import {
  isMongoDuplicateKeyError,
  normalizeAuthorSocialLinks,
  normalizeAuthorTags,
  normalizeBio,
  normalizeDisplayName,
  normalizeRequestedAuthorDefaultPolicy,
  normalizeSlug,
  normalizeUsername,
  normalizeWallet,
  parseObjectId,
  resolveDefaultPolicyFromPreset,
  toAuthorProfileResponse,
  toAuthorStorageUsageResponse,
} from "../lib/content-common";
import {
  assertAvatarFile,
  readProfileAvatarFile,
  uploadProfileAvatarFile,
} from "./avatar-storage";
import type {
  AuthorCatalogItemResponse,
  AuthorProfileDoc,
  AuthorStorageUsageResponse,
  AuthorStorageUsageStats,
  CreateAuthorProfileRequest,
  UpdateAuthorProfileRequest,
  UpdateMyProfileRequest,
  UserDoc,
} from "../lib/content-types";
import * as postsRepo from "../posts/repository";
import * as profilesRepo from "../profiles/repository";
import * as projectsRepo from "../projects/repository";
import * as subscriptionsRepo from "../subscriptions/repository";

const repo = {
  ...accessRepo,
  ...postsRepo,
  ...profilesRepo,
  ...projectsRepo,
  ...subscriptionsRepo,
};

export {
  toAuthorProfileResponse,
  toAuthorStorageUsageResponse,
  toUserProfileResponse,
} from "../lib/content-common";

export async function getOrCreateUserByWallet(
  walletAddress: string,
): Promise<UserDoc> {
  const normalizedWallet = normalizeWallet(walletAddress);
  const existing = await repo.findUserByPrimaryWallet(normalizedWallet);
  if (existing) {
    return existing;
  }

  const now = new Date();
  return repo.createUser({
    username: null,
    displayName: shortenWalletAddress(normalizedWallet),
    bio: "",
    avatarFileId: null,
    primaryWallet: normalizedWallet,
    wallets: [
      {
        address: normalizedWallet,
        kind: "primary",
        addedAt: now,
      },
    ],
    role: "user",
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateMyProfile(
  walletAddress: string,
  update: UpdateMyProfileRequest,
): Promise<UserDoc> {
  const user = await getOrCreateUserByWallet(walletAddress);

  const nextUsername =
    update.username === undefined
      ? user.username
      : normalizeUsername(update.username);
  const nextDisplayName =
    update.displayName === undefined
      ? user.displayName
      : normalizeDisplayName(update.displayName);
  const nextBio =
    update.bio === undefined ? user.bio : normalizeBio(update.bio);

  const updated = await repo.updateUser(user._id, {
    username: nextUsername,
    displayName: nextDisplayName,
    bio: nextBio,
    updatedAt: new Date(),
  });

  if (!updated) {
    throw APIError.notFound("user not found");
  }

  return updated;
}

export async function getAuthorProfileBySlug(
  slug: string,
): Promise<AuthorProfileDoc> {
  const author = await repo.findAuthorProfileBySlug(normalizeSlug(slug));
  if (!author) {
    throw APIError.notFound("author profile not found");
  }
  return author;
}

export async function listAuthors(
  search?: string,
): Promise<AuthorCatalogItemResponse[]> {
  const authors = await repo.listAuthorProfiles(search);
  return Promise.all(
    authors.map(async (author) => {
      const [postsCount, plans] = await Promise.all([
        repo.countPublishedPostsByAuthorId(author._id),
        repo.listActiveSubscriptionPlansByAuthorId(author._id),
      ]);

      return {
        ...toAuthorProfileResponse(author),
        postsCount,
        subscriptionPlansCount: plans.length,
      };
    }),
  );
}

export async function getMyAuthorStorageUsage(
  walletAddress: string,
): Promise<AuthorStorageUsageResponse> {
  const author = await getMyAuthorProfile(walletAddress);
  return toAuthorStorageUsageResponse(
    author,
    await getAuthorStorageUsageStats(author),
  );
}

async function getAuthorStorageUsageStats(
  author: AuthorProfileDoc,
): Promise<AuthorStorageUsageStats> {
  const [postsBytes, projectsBytes] = await Promise.all([
    repo.sumPostAttachmentBytesByAuthorId(author._id),
    repo.sumProjectFileBytesByAuthorId(author._id),
  ]);

  return { postsBytes, projectsBytes };
}

export async function getMyAuthorProfile(
  walletAddress: string,
): Promise<AuthorProfileDoc> {
  const user = await getOrCreateUserByWallet(walletAddress);
  const author = await repo.findAuthorProfileByUserId(user._id.toHexString());
  if (!author) {
    throw APIError.notFound("author profile not found");
  }
  return author;
}

export async function updateMyAuthorProfile(
  walletAddress: string,
  update: UpdateAuthorProfileRequest,
): Promise<AuthorProfileDoc> {
  const author = await getMyAuthorProfile(walletAddress);

  const nextDisplayName =
    update.displayName === undefined
      ? author.displayName
      : normalizeDisplayName(update.displayName);
  const nextBio =
    update.bio === undefined ? author.bio : normalizeBio(update.bio);
  const nextTags =
    update.tags === undefined
      ? (author.tags ?? [])
      : normalizeAuthorTags(update.tags);
  const nextSocialLinks =
    update.socialLinks === undefined
      ? (author.socialLinks ?? [])
      : normalizeAuthorSocialLinks(update.socialLinks);
  const nextDefaultPolicy =
    update.defaultPolicyId !== undefined
      ? await resolveDefaultPolicyFromPreset(author, update.defaultPolicyId)
      : update.defaultPolicy === undefined &&
          update.defaultPolicyInput === undefined
        ? author.defaultPolicy
        : await normalizeRequestedAuthorDefaultPolicy(
            author,
            update.defaultPolicy,
            update.defaultPolicyInput,
          );

  const updated = await repo.updateAuthorProfile(author._id, {
    displayName: nextDisplayName,
    bio: nextBio,
    tags: nextTags,
    socialLinks: nextSocialLinks,
    defaultPolicy: nextDefaultPolicy,
    defaultPolicyId:
      update.defaultPolicyId === undefined
        ? author.defaultPolicyId
        : update.defaultPolicyId
          ? parseObjectId(update.defaultPolicyId, "defaultPolicyId")
          : null,
    updatedAt: new Date(),
  });

  if (!updated) {
    throw APIError.notFound("author profile not found");
  }

  return updated;
}

export async function deleteMyAuthorProfile(
  walletAddress: string,
): Promise<void> {
  const user = await getOrCreateUserByWallet(walletAddress);
  const author = await repo.findAuthorProfileByUserId(user._id.toHexString());
  if (!author) {
    throw APIError.notFound("author profile not found");
  }

  await repo.deleteSubscriptionPaymentIntentsByAuthorId(author._id);
  await repo.deleteSubscriptionEntitlementsByAuthorId(author._id);
  await repo.deleteSubscriptionPlansByAuthorId(author._id);
  await repo.deleteProjectNodesByAuthorId(author._id);
  await repo.deleteProjectsByAuthorId(author._id);
  await repo.deletePostsByAuthorId(author._id);
  await repo.deleteAccessPolicyPresetsByAuthorId(author._id);

  const deleted = await repo.deleteAuthorProfileByIdAndUserId(
    author._id,
    user._id.toHexString(),
  );
  if (!deleted) {
    throw APIError.notFound("author profile not found");
  }
}

export async function createAuthorProfile(
  walletAddress: string,
  input: CreateAuthorProfileRequest,
): Promise<AuthorProfileDoc> {
  const user = await getOrCreateUserByWallet(walletAddress);
  const existing = await repo.findAuthorProfileByUserId(user._id.toHexString());
  if (existing) {
    throw APIError.alreadyExists("author profile already exists");
  }

  const slug = normalizeSlug(input.slug);
  const existingSlug = await repo.findAuthorProfileBySlug(slug);
  if (existingSlug) {
    throw APIError.alreadyExists("author slug already exists");
  }

  const displayName = normalizeDisplayName(input.displayName);
  const bio = normalizeBio(input.bio ?? "");
  const tags = normalizeAuthorTags(input.tags ?? []);
  const socialLinks = normalizeAuthorSocialLinks(input.socialLinks);
  const defaultPolicy = await normalizeRequestedAuthorDefaultPolicy(
    null,
    input.defaultPolicy,
    input.defaultPolicyInput,
  );
  const now = new Date();

  const author = await createAuthorProfileOrThrowConflict({
    userId: user._id.toHexString(),
    slug,
    displayName,
    bio,
    tags,
    socialLinks,
    avatarFileId: user.avatarFileId,
    defaultPolicy,
    defaultPolicyId: null,
    subscriptionPlanId: null,
    createdAt: now,
    updatedAt: now,
  });

  const preset = await repo.createAccessPolicyPreset({
    authorId: author._id,
    name: "Default access",
    description: "Default access policy for inherited content.",
    policy: defaultPolicy,
    isDefault: true,
    createdAt: now,
    updatedAt: now,
  });

  const updated = await repo.updateAuthorProfile(author._id, {
    defaultPolicyId: preset._id,
    updatedAt: now,
  });

  return updated ?? { ...author, defaultPolicyId: preset._id };
}

export async function uploadMyProfileAvatar(
  walletAddress: string,
  input: { body: Buffer; contentType: string },
): Promise<UserDoc> {
  const user = await getOrCreateUserByWallet(walletAddress);
  const avatarFileId = new ObjectId();
  assertAvatarFile(input.body, input.contentType);
  await uploadProfileAvatarFile(avatarFileId, input.body, input.contentType);

  const now = new Date();
  const updatedUser = await repo.updateUser(user._id, {
    avatarFileId,
    updatedAt: now,
  });
  if (!updatedUser) {
    throw APIError.notFound("user not found");
  }

  await repo.updateAuthorProfileByUserId(user._id.toHexString(), {
    avatarFileId,
    updatedAt: now,
  });

  return updatedUser;
}

export async function uploadMyAuthorAvatar(
  walletAddress: string,
  input: { body: Buffer; contentType: string },
): Promise<AuthorProfileDoc> {
  const user = await getOrCreateUserByWallet(walletAddress);
  const author = await getMyAuthorProfile(walletAddress);
  const avatarFileId = new ObjectId();
  assertAvatarFile(input.body, input.contentType);
  await uploadProfileAvatarFile(avatarFileId, input.body, input.contentType);

  const now = new Date();
  await repo.updateUser(user._id, {
    avatarFileId,
    updatedAt: now,
  });

  const updatedAuthor = await repo.updateAuthorProfile(author._id, {
    avatarFileId,
    updatedAt: now,
  });
  if (!updatedAuthor) {
    throw APIError.notFound("author profile not found");
  }

  return updatedAuthor;
}

export async function getProfileAvatar(
  avatarFileId: string,
): Promise<{ body: Buffer; contentType: string; fileName: string }> {
  return readProfileAvatarFile(parseObjectId(avatarFileId, "avatarFileId"));
}

async function createAuthorProfileOrThrowConflict(
  doc: Omit<AuthorProfileDoc, "_id">,
): Promise<AuthorProfileDoc> {
  try {
    return await repo.createAuthorProfile(doc);
  } catch (error) {
    if (isMongoDuplicateKeyError(error)) {
      throw APIError.alreadyExists("author slug already exists");
    }

    throw error;
  }
}
