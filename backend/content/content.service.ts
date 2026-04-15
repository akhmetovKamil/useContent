import { APIError } from "encore.dev/api";
import { ObjectId } from "mongodb";
import { createPublicPolicy, isAccessPolicy, resolveEntityPolicy } from "../domain/access";
import * as repo from "./repository";
import type {
  AuthorProfileDoc,
  AuthorProfileResponse,
  CreateAuthorProfileRequest,
  CreatePostRequest,
  PostDoc,
  PostResponse,
  SubscriptionPlanDoc,
  SubscriptionPlanResponse,
  SubscriptionEntitlementDoc,
  SubscriptionEntitlementResponse,
  UpsertSubscriptionPlanRequest,
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

export async function getMyAuthorProfile(
  walletAddress: string
): Promise<AuthorProfileDoc> {
  const user = await getOrCreateUserByWallet(walletAddress);
  const author = await repo.findAuthorProfileByUserId(user._id.toHexString());
  if (!author) {
    throw APIError.notFound("author profile not found");
  }
  return author;
}

export async function listMyEntitlements(
  walletAddress: string
): Promise<SubscriptionEntitlementDoc[]> {
  const normalizedWallet = normalizeWallet(walletAddress);
  return repo.listSubscriptionEntitlementsByWallet(normalizedWallet);
}

export async function getMySubscriptionPlan(
  walletAddress: string
): Promise<SubscriptionPlanDoc> {
  const author = await getMyAuthorProfile(walletAddress);
  const plan = await getAuthorMainSubscriptionPlan(author);
  if (!plan) {
    throw APIError.notFound("subscription plan not found");
  }
  return plan;
}

export async function getAuthorSubscriptionPlanBySlug(
  slug: string
): Promise<SubscriptionPlanDoc> {
  const author = await getAuthorProfileBySlug(slug);
  const plan = await getAuthorMainSubscriptionPlan(author);
  if (!plan || !plan.active) {
    throw APIError.notFound("subscription plan not found");
  }
  return plan;
}

export async function upsertMySubscriptionPlan(
  walletAddress: string,
  input: UpsertSubscriptionPlanRequest
): Promise<SubscriptionPlanDoc> {
  const author = await getMyAuthorProfile(walletAddress);
  const now = new Date();
  const title = normalizePlanTitle(input.title);
  const chainId = normalizeChainId(input.chainId);
  const tokenAddress = normalizeWallet(input.tokenAddress);
  const price = normalizePositiveInteger(input.price, "price");
  const billingPeriodDays = normalizeBillingPeriodDays(input.billingPeriodDays);
  const contractAddress = normalizeWallet(input.contractAddress);
  const active = input.active ?? true;

  const existing = await getAuthorMainSubscriptionPlan(author);
  if (existing) {
    const updated = await repo.updateSubscriptionPlan(existing._id, {
      title,
      chainId,
      tokenAddress,
      price,
      billingPeriodDays,
      contractAddress,
      active,
      updatedAt: now,
    });
    if (!updated) {
      throw APIError.notFound("subscription plan not found");
    }
    return updated;
  }

  const created = await repo.createSubscriptionPlan({
    authorId: author._id,
    code: "main",
    title,
    chainId,
    tokenAddress,
    price,
    billingPeriodDays,
    contractAddress,
    active,
    createdAt: now,
    updatedAt: now,
  });

  await repo.updateAuthorProfile(author._id, {
    subscriptionPlanId: created._id,
    updatedAt: now,
  });

  return created;
}

export async function createMyPost(
  walletAddress: string,
  input: CreatePostRequest
): Promise<PostDoc> {
  const author = await getMyAuthorProfile(walletAddress);
  const now = new Date();
  const title = normalizePostTitle(input.title);
  const content = normalizePostContent(input.content);
  const status = input.status ?? "draft";
  const policyMode = input.policyMode ?? "inherited";
  const policy = normalizePostPolicy(input.policy ?? null, policyMode);
  const attachmentIds = normalizeAttachmentIds(input.attachmentIds ?? []);

  resolveEntityPolicy(policyMode, author.defaultPolicy, policy);

  return repo.createPost({
    authorId: author._id,
    title,
    content,
    status,
    policyMode,
    policy,
    attachmentIds,
    publishedAt: status === "published" ? now : null,
    createdAt: now,
    updatedAt: now,
  });
}

export async function listMyPosts(
  walletAddress: string
): Promise<PostDoc[]> {
  const author = await getMyAuthorProfile(walletAddress);
  return repo.listPostsByAuthorId(author._id);
}

export async function listAuthorPostsBySlug(
  slug: string
): Promise<PostDoc[]> {
  const author = await getAuthorProfileBySlug(slug);
  return repo.listPublishedPostsByAuthorId(author._id);
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

export function toSubscriptionEntitlementResponse(
  entitlement: SubscriptionEntitlementDoc
): SubscriptionEntitlementResponse {
  return {
    id: entitlement._id.toHexString(),
    authorId: entitlement.authorId.toHexString(),
    subscriberWallet: entitlement.subscriberWallet,
    planId: entitlement.planId.toHexString(),
    status: entitlement.status,
    validUntil: entitlement.validUntil.toISOString(),
    source: entitlement.source,
    createdAt: entitlement.createdAt.toISOString(),
    updatedAt: entitlement.updatedAt.toISOString(),
  };
}

export function toSubscriptionPlanResponse(
  plan: SubscriptionPlanDoc
): SubscriptionPlanResponse {
  return {
    id: plan._id.toHexString(),
    authorId: plan.authorId.toHexString(),
    code: plan.code,
    title: plan.title,
    chainId: plan.chainId,
    tokenAddress: plan.tokenAddress,
    price: plan.price,
    billingPeriodDays: plan.billingPeriodDays,
    contractAddress: plan.contractAddress,
    active: plan.active,
    createdAt: plan.createdAt.toISOString(),
    updatedAt: plan.updatedAt.toISOString(),
  };
}

export function toPostResponse(post: PostDoc): PostResponse {
  return {
    id: post._id.toHexString(),
    authorId: post.authorId.toHexString(),
    title: post.title,
    content: post.content,
    status: post.status,
    policyMode: post.policyMode,
    policy: post.policy,
    attachmentIds: post.attachmentIds.map((id) => id.toHexString()),
    publishedAt: post.publishedAt?.toISOString() ?? null,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
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

function normalizePlanTitle(title: string): string {
  const value = title.trim();
  if (!value) {
    throw APIError.invalidArgument("plan title is required");
  }
  if (value.length > 120) {
    throw APIError.invalidArgument("plan title is too long");
  }
  return value;
}

function normalizeChainId(chainId: number): number {
  if (!Number.isInteger(chainId) || chainId <= 0) {
    throw APIError.invalidArgument("chainId must be a positive integer");
  }
  return chainId;
}

function normalizeBillingPeriodDays(days: number): number {
  if (!Number.isInteger(days) || days <= 0 || days > 3650) {
    throw APIError.invalidArgument(
      "billingPeriodDays must be an integer between 1 and 3650"
    );
  }
  return days;
}

function normalizePositiveInteger(value: string, field: string): string {
  const normalized = value.trim();
  if (!/^[0-9]+$/.test(normalized)) {
    throw APIError.invalidArgument(`${field} must be a positive integer string`);
  }
  if (BigInt(normalized) <= 0n) {
    throw APIError.invalidArgument(`${field} must be greater than zero`);
  }
  return normalized;
}

function normalizePostTitle(title: string): string {
  const value = title.trim();
  if (!value) {
    throw APIError.invalidArgument("post title is required");
  }
  if (value.length > 160) {
    throw APIError.invalidArgument("post title is too long");
  }
  return value;
}

function normalizePostContent(content: string): string {
  const value = content.trim();
  if (!value) {
    throw APIError.invalidArgument("post content is required");
  }
  if (value.length > 50000) {
    throw APIError.invalidArgument("post content is too long");
  }
  return value;
}

function normalizePostPolicy(
  policy: CreatePostRequest["policy"],
  policyMode: CreatePostRequest["policyMode"] extends undefined
    ? never
    : NonNullable<CreatePostRequest["policyMode"]>
) {
  if (policyMode !== "custom") {
    return null;
  }

  if (!policy || !isAccessPolicy(policy)) {
    throw APIError.invalidArgument("custom policy is required");
  }

  return policy;
}

function normalizeAttachmentIds(attachmentIds: string[]): ObjectId[] {
  return attachmentIds.map((id) => new ObjectId(id));
}

function shortenWallet(walletAddress: string): string {
  if (walletAddress.length <= 10) {
    return walletAddress;
  }

  return `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
}

async function getAuthorMainSubscriptionPlan(
  author: AuthorProfileDoc
): Promise<SubscriptionPlanDoc | null> {
  if (author.subscriptionPlanId) {
    const byId = await repo.findSubscriptionPlanById(author.subscriptionPlanId);
    if (byId) {
      return byId;
    }
  }

  return repo.findSubscriptionPlanByAuthorIdAndCode(author._id, "main");
}
