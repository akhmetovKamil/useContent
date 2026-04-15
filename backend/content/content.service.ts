import { APIError } from "encore.dev/api";
import { ObjectId } from "mongodb";
import { createPublicPolicy } from "../domain/access";
import * as repo from "./repository";
import type {
  AuthorProfileDoc,
  AuthorProfileResponse,
  CreateAuthorProfileRequest,
  UpdateMyProfileRequest,
  UserDoc,
  UserProfileResponse,
} from "./types";

export async function getOrCreateUserByWallet(
  walletAddress: string
): Promise<UserDoc> {
  const normalizedWallet = normalizeWallet(walletAddress);
  const existing = await repo.findUserByPrimaryWallet(normalizedWallet);
  if (existing) {
    return existing;
  }

  const now = new Date();
  return repo.createUser({
    username: null,
    displayName: shortenWallet(normalizedWallet),
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
  update: UpdateMyProfileRequest
): Promise<UserDoc> {
  const user = await getOrCreateUserByWallet(walletAddress);

  const nextUsername =
    update.username === undefined ? user.username : normalizeUsername(update.username);
  const nextDisplayName =
    update.displayName === undefined ? user.displayName : normalizeDisplayName(update.displayName);
  const nextBio = update.bio === undefined ? user.bio : normalizeBio(update.bio);

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
  slug: string
): Promise<AuthorProfileDoc> {
  const author = await repo.findAuthorProfileBySlug(normalizeSlug(slug));
  if (!author) {
    throw APIError.notFound("author profile not found");
  }
  return author;
}

export async function createAuthorProfile(
  walletAddress: string,
  input: CreateAuthorProfileRequest
): Promise<AuthorProfileDoc> {
  const user = await getOrCreateUserByWallet(walletAddress);
  const existing = await repo.findAuthorProfileByUserId(user._id.toHexString());
  if (existing) {
    throw APIError.alreadyExists("author profile already exists");
  }

  const slug = normalizeSlug(input.slug);
  const displayName = normalizeDisplayName(input.displayName);
  const bio = normalizeBio(input.bio ?? "");
  const now = new Date();

  return repo.createAuthorProfile({
    userId: user._id.toHexString(),
    slug,
    displayName,
    bio,
    avatarFileId: user.avatarFileId,
    defaultPolicy: createPublicPolicy(),
    subscriptionPlanId: null,
    createdAt: now,
    updatedAt: now,
  });
}

export function toUserProfileResponse(user: UserDoc): UserProfileResponse {
  return {
    id: user._id.toHexString(),
    username: user.username,
    displayName: user.displayName,
    bio: user.bio,
    avatarFileId: user.avatarFileId?.toHexString() ?? null,
    primaryWallet: user.primaryWallet,
    wallets: user.wallets,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export function toAuthorProfileResponse(
  author: AuthorProfileDoc
): AuthorProfileResponse {
  return {
    id: author._id.toHexString(),
    userId: author.userId,
    slug: author.slug,
    displayName: author.displayName,
    bio: author.bio,
    avatarFileId: author.avatarFileId?.toHexString() ?? null,
    subscriptionPlanId: author.subscriptionPlanId?.toHexString() ?? null,
    createdAt: author.createdAt.toISOString(),
    updatedAt: author.updatedAt.toISOString(),
  };
}

function normalizeWallet(walletAddress: string): string {
  const value = walletAddress.trim().toLowerCase();
  if (!value) {
    throw APIError.invalidArgument("wallet address is required");
  }
  return value;
}

function normalizeUsername(username: string | null): string | null {
  if (username === null) {
    return null;
  }

  const value = username.trim().toLowerCase();
  if (!value) {
    return null;
  }

  if (!/^[a-z0-9_]{3,32}$/.test(value)) {
    throw APIError.invalidArgument("username must be 3-32 chars: a-z, 0-9, _");
  }

  return value;
}

function normalizeDisplayName(displayName: string): string {
  const value = displayName.trim();
  if (!value) {
    throw APIError.invalidArgument("display name is required");
  }

  if (value.length > 80) {
    throw APIError.invalidArgument("display name is too long");
  }

  return value;
}

function normalizeBio(bio: string): string {
  const value = bio.trim();
  if (value.length > 500) {
    throw APIError.invalidArgument("bio is too long");
  }
  return value;
}

function normalizeSlug(slug: string): string {
  const value = slug.trim().toLowerCase();
  if (!/^[a-z0-9-]{3,50}$/.test(value)) {
    throw APIError.invalidArgument("slug must be 3-50 chars: a-z, 0-9, -");
  }
  return value;
}

function shortenWallet(walletAddress: string): string {
  if (walletAddress.length <= 10) {
    return walletAddress;
  }

  return `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
}
