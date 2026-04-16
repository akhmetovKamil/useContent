import { APIError } from "encore.dev/api";
import { ObjectId } from "mongodb";
import {
  ACCESS_POLICY_VERSION,
  type AccessPolicy,
  type AccessPolicyNode,
  createPublicPolicy,
  evaluateAccessPolicy,
  isAccessPolicy,
  resolveEntityPolicy,
} from "../domain/access";
import { deleteObject } from "../storage/object-storage";
import * as repo from "./repository";
import type {
  AuthorProfileDoc,
  AuthorProfileResponse,
  CreateAuthorProfileRequest,
  CreatePostRequest,
  CreateProjectRequest,
  PostDoc,
  PostResponse,
  ProjectDoc,
  ProjectResponse,
  SubscriptionPlanDoc,
  SubscriptionPlanResponse,
  SubscriptionEntitlementDoc,
  SubscriptionEntitlementResponse,
  UpdateAuthorProfileRequest,
  UpsertSubscriptionPlanRequest,
  UpdateMyProfileRequest,
  UpdatePostRequest,
  UpdateProjectRequest,
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

export async function updateMyAuthorProfile(
  walletAddress: string,
  update: UpdateAuthorProfileRequest
): Promise<AuthorProfileDoc> {
  const author = await getMyAuthorProfile(walletAddress);

  const nextDisplayName =
    update.displayName === undefined
      ? author.displayName
      : normalizeDisplayName(update.displayName);
  const nextBio = update.bio === undefined ? author.bio : normalizeBio(update.bio);
  const nextDefaultPolicy =
    update.defaultPolicy === undefined && update.defaultPolicyInput === undefined
      ? author.defaultPolicy
      : await normalizeRequestedAuthorDefaultPolicy(
          author,
          update.defaultPolicy,
          update.defaultPolicyInput
        );

  const updated = await repo.updateAuthorProfile(author._id, {
    displayName: nextDisplayName,
    bio: nextBio,
    defaultPolicy: nextDefaultPolicy,
    updatedAt: new Date(),
  });

  if (!updated) {
    throw APIError.notFound("author profile not found");
  }

  return updated;
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
  const policy = await normalizePostPolicy(author, input, policyMode);
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

export async function updateMyPost(
  walletAddress: string,
  postId: string,
  input: UpdatePostRequest
): Promise<PostDoc> {
  const author = await getMyAuthorProfile(walletAddress);
  const objectId = parseObjectId(postId, "postId");
  const existing = await repo.findPostByIdAndAuthorId(objectId, author._id);
  if (!existing) {
    throw APIError.notFound("post not found");
  }

  const nextStatus = input.status ?? existing.status;
  const nextPolicyMode = input.policyMode ?? existing.policyMode;
  const nextPolicy =
    input.policyMode === undefined &&
    input.policy === undefined &&
    input.policyInput === undefined
      ? existing.policy
      : await normalizePostPolicy(author, input, nextPolicyMode);

  resolveEntityPolicy(nextPolicyMode, author.defaultPolicy, nextPolicy);

  const updated = await repo.updatePost(objectId, author._id, {
    title:
      input.title === undefined ? existing.title : normalizePostTitle(input.title),
    content:
      input.content === undefined
        ? existing.content
        : normalizePostContent(input.content),
    status: nextStatus,
    policyMode: nextPolicyMode,
    policy: nextPolicy,
    attachmentIds:
      input.attachmentIds === undefined
        ? existing.attachmentIds
        : normalizeAttachmentIds(input.attachmentIds),
    publishedAt: resolvePublishedAt(existing.publishedAt, existing.status, nextStatus),
    updatedAt: new Date(),
  });

  if (!updated) {
    throw APIError.notFound("post not found");
  }

  return updated;
}

export async function deleteMyPost(
  walletAddress: string,
  postId: string
): Promise<void> {
  const author = await getMyAuthorProfile(walletAddress);
  const deleted = await repo.deletePost(parseObjectId(postId, "postId"), author._id);
  if (!deleted) {
    throw APIError.notFound("post not found");
  }
}

export async function listAuthorPostsBySlug(
  slug: string
): Promise<PostDoc[]> {
  const author = await getAuthorProfileBySlug(slug);
  return repo.listPublishedPostsByAuthorId(author._id);
}

export async function getAuthorPostBySlugAndId(
  slug: string,
  postId: string,
  viewerWallet?: string
): Promise<PostDoc> {
  const author = await getAuthorProfileBySlug(slug);
  const objectId = parseObjectId(postId, "postId");
  const post = await repo.findPublishedPostByIdAndAuthorId(objectId, author._id);
  if (!post) {
    throw APIError.notFound("post not found");
  }

  const resolvedPolicy = resolveEntityPolicy(
    post.policyMode,
    author.defaultPolicy,
    post.policy
  );

  const evaluation = evaluateAccessPolicy(resolvedPolicy, {
    subscriptions: viewerWallet
      ? await buildSubscriptionGrants(author._id, viewerWallet)
      : [],
    tokenBalances: [],
    nftOwnerships: [],
  });

  if (!evaluation.allowed) {
    throw APIError.permissionDenied("access to this post is restricted");
  }

  return post;
}

export async function createMyProject(
  walletAddress: string,
  input: CreateProjectRequest
): Promise<ProjectDoc> {
  const author = await getMyAuthorProfile(walletAddress);
  const now = new Date();
  const projectId = new ObjectId();
  const rootNodeId = new ObjectId();
  const title = normalizeProjectTitle(input.title);
  const description = normalizeProjectDescription(input.description ?? "");
  const status = input.status ?? "draft";
  const policyMode = input.policyMode ?? "inherited";
  const policy = await normalizeProjectPolicy(author, input, policyMode);

  resolveEntityPolicy(policyMode, author.defaultPolicy, policy);

  const rootNode = await repo.createProjectNode({
    _id: rootNodeId,
    authorId: author._id,
    projectId,
    parentId: null,
    kind: "folder",
    name: title,
    storageKey: null,
    mimeType: null,
    size: null,
    visibility: "published",
    createdAt: now,
    updatedAt: now,
  });

  const project = await repo.createProject({
    _id: projectId,
    authorId: author._id,
    title,
    description,
    status,
    policyMode,
    policy,
    rootNodeId,
    publishedAt: status === "published" ? now : null,
    createdAt: now,
    updatedAt: now,
  });

  if (!project.rootNodeId.equals(rootNode._id)) {
    throw APIError.internal("project root node mismatch");
  }

  return project;
}

export async function listMyProjects(
  walletAddress: string
): Promise<ProjectDoc[]> {
  const author = await getMyAuthorProfile(walletAddress);
  return repo.listProjectsByAuthorId(author._id);
}

export async function updateMyProject(
  walletAddress: string,
  projectId: string,
  input: UpdateProjectRequest
): Promise<ProjectDoc> {
  const author = await getMyAuthorProfile(walletAddress);
  const objectId = parseObjectId(projectId, "projectId");
  const existing = await repo.findProjectByIdAndAuthorId(objectId, author._id);
  if (!existing) {
    throw APIError.notFound("project not found");
  }

  const nextStatus = input.status ?? existing.status;
  const nextPolicyMode = input.policyMode ?? existing.policyMode;
  const nextPolicy =
    input.policyMode === undefined &&
    input.policy === undefined &&
    input.policyInput === undefined
      ? existing.policy
      : await normalizeProjectPolicy(author, input, nextPolicyMode);

  resolveEntityPolicy(nextPolicyMode, author.defaultPolicy, nextPolicy);

  const updated = await repo.updateProject(objectId, author._id, {
    title:
      input.title === undefined
        ? existing.title
        : normalizeProjectTitle(input.title),
    description:
      input.description === undefined
        ? existing.description
        : normalizeProjectDescription(input.description),
    status: nextStatus,
    policyMode: nextPolicyMode,
    policy: nextPolicy,
    publishedAt: resolvePublishedAt(existing.publishedAt, existing.status, nextStatus),
    updatedAt: new Date(),
  });

  if (!updated) {
    throw APIError.notFound("project not found");
  }

  if (input.title !== undefined) {
    await repo.updateProjectNode(existing.rootNodeId, existing._id, {
      name: updated.title,
      updatedAt: new Date(),
    });
  }

  return updated;
}

export async function deleteMyProject(
  walletAddress: string,
  projectId: string
): Promise<void> {
  const author = await getMyAuthorProfile(walletAddress);
  const objectId = parseObjectId(projectId, "projectId");
  const project = await repo.findProjectByIdAndAuthorId(objectId, author._id);
  if (!project) {
    throw APIError.notFound("project not found");
  }

  const nodes = await repo.listProjectNodesByProjectId(project._id);
  for (const node of nodes) {
    if (node.kind === "file" && node.storageKey) {
      await deleteObject(node.storageKey);
    }
  }

  await repo.deleteProjectNodesByProjectId(project._id);
  const deleted = await repo.deleteProject(objectId, author._id);
  if (!deleted) {
    throw APIError.notFound("project not found");
  }
}

export async function listAuthorProjectsBySlug(
  slug: string
): Promise<ProjectDoc[]> {
  const author = await getAuthorProfileBySlug(slug);
  return repo.listPublishedProjectsByAuthorId(author._id);
}

export async function getAuthorProjectBySlugAndId(
  slug: string,
  projectId: string,
  viewerWallet?: string
): Promise<ProjectDoc> {
  const author = await getAuthorProfileBySlug(slug);
  const objectId = parseObjectId(projectId, "projectId");
  const project = await repo.findPublishedProjectByIdAndAuthorId(
    objectId,
    author._id
  );
  if (!project) {
    throw APIError.notFound("project not found");
  }

  const resolvedPolicy = resolveEntityPolicy(
    project.policyMode,
    author.defaultPolicy,
    project.policy
  );

  const evaluation = evaluateAccessPolicy(resolvedPolicy, {
    subscriptions: viewerWallet
      ? await buildSubscriptionGrants(author._id, viewerWallet)
      : [],
    tokenBalances: [],
    nftOwnerships: [],
  });

  if (!evaluation.allowed) {
    throw APIError.permissionDenied("access to this project is restricted");
  }

  return project;
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
  const defaultPolicy = await normalizeRequestedAuthorDefaultPolicy(
    null,
    input.defaultPolicy,
    input.defaultPolicyInput
  );
  const now = new Date();

  return repo.createAuthorProfile({
    userId: user._id.toHexString(),
    slug,
    displayName,
    bio,
    avatarFileId: user.avatarFileId,
    defaultPolicy,
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
    wallets: user.wallets.map((wallet) => ({
      address: wallet.address,
      kind: wallet.kind,
      addedAt: wallet.addedAt.toISOString(),
    })),
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
    defaultPolicy: author.defaultPolicy,
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

export function toProjectResponse(project: ProjectDoc): ProjectResponse {
  return {
    id: project._id.toHexString(),
    authorId: project.authorId.toHexString(),
    title: project.title,
    description: project.description,
    status: project.status,
    policyMode: project.policyMode,
    policy: project.policy,
    rootNodeId: project.rootNodeId.toHexString(),
    publishedAt: project.publishedAt?.toISOString() ?? null,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
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

async function normalizePostPolicy(
  author: AuthorProfileDoc,
  input: CreatePostRequest | UpdatePostRequest,
  policyMode: NonNullable<CreatePostRequest["policyMode"] | UpdatePostRequest["policyMode"]>
) {
  if (policyMode !== "custom") {
    return null;
  }

  return normalizeRequestedCustomPolicy(
    author,
    input.policy ?? null,
    input.policyInput
  );
}

function normalizeAccessPolicy(policy: unknown, field: string) {
  if (!isAccessPolicy(policy)) {
    throw APIError.invalidArgument(`${field} is invalid`);
  }

  return policy;
}

function normalizeProjectTitle(title: string): string {
  const value = title.trim();
  if (!value) {
    throw APIError.invalidArgument("project title is required");
  }
  if (value.length > 160) {
    throw APIError.invalidArgument("project title is too long");
  }
  return value;
}

function normalizeProjectDescription(description: string): string {
  const value = description.trim();
  if (value.length > 5000) {
    throw APIError.invalidArgument("project description is too long");
  }
  return value;
}

async function normalizeProjectPolicy(
  author: AuthorProfileDoc,
  input: CreateProjectRequest | UpdateProjectRequest,
  policyMode: NonNullable<
    CreateProjectRequest["policyMode"] | UpdateProjectRequest["policyMode"]
  >
) {
  if (policyMode !== "custom") {
    return null;
  }

  return normalizeRequestedCustomPolicy(
    author,
    input.policy ?? null,
    input.policyInput
  );
}

async function normalizeRequestedAuthorDefaultPolicy(
  author: AuthorProfileDoc | null,
  policy: CreateAuthorProfileRequest["defaultPolicy"] | UpdateAuthorProfileRequest["defaultPolicy"],
  policyInput:
    | CreateAuthorProfileRequest["defaultPolicyInput"]
    | UpdateAuthorProfileRequest["defaultPolicyInput"]
) {
  if (policy !== undefined && policyInput !== undefined) {
    throw APIError.invalidArgument(
      "provide either defaultPolicy or defaultPolicyInput"
    );
  }

  if (policyInput !== undefined) {
    return buildAccessPolicyFromInput(policyInput, author);
  }

  if (policy !== undefined) {
    return normalizeAccessPolicy(policy, "default policy");
  }

  return createPublicPolicy();
}

async function normalizeRequestedCustomPolicy(
  author: AuthorProfileDoc,
  policy: CreatePostRequest["policy"] | CreateProjectRequest["policy"],
  policyInput: CreatePostRequest["policyInput"] | CreateProjectRequest["policyInput"]
) {
  if (policy !== undefined && policyInput !== undefined) {
    throw APIError.invalidArgument("provide either policy or policyInput");
  }

  if (policyInput !== undefined) {
    return buildAccessPolicyFromInput(policyInput, author);
  }

  if (!policy || !isAccessPolicy(policy)) {
    throw APIError.invalidArgument("custom policy is required");
  }

  return policy;
}

function resolvePublishedAt(
  currentPublishedAt: Date | null,
  currentStatus: "draft" | "published",
  nextStatus: "draft" | "published"
): Date | null {
  if (nextStatus === "draft") {
    return null;
  }

  if (currentStatus === "published" && currentPublishedAt) {
    return currentPublishedAt;
  }

  return new Date();
}

function normalizeAttachmentIds(attachmentIds: string[]): ObjectId[] {
  return attachmentIds.map((id) => new ObjectId(id));
}

function parseObjectId(value: string, field: string): ObjectId {
  if (!ObjectId.isValid(value)) {
    throw APIError.invalidArgument(`${field} is invalid`);
  }

  return new ObjectId(value);
}

async function buildSubscriptionGrants(
  authorId: ObjectId,
  viewerWallet: string
) {
  const entitlements = await repo.listSubscriptionEntitlementsByWalletAndAuthorId(
    normalizeWallet(viewerWallet),
    authorId
  );

  return entitlements.map((entitlement) => ({
    authorId: entitlement.authorId.toHexString(),
    planId: entitlement.planId.toHexString(),
    active:
      entitlement.status === "active" &&
      entitlement.validUntil.getTime() > Date.now(),
  }));
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

export async function buildAccessPolicyFromInput(
  policyInput:
    | NonNullable<CreateAuthorProfileRequest["defaultPolicyInput"]>
    | NonNullable<UpdateAuthorProfileRequest["defaultPolicyInput"]>
    | NonNullable<CreatePostRequest["policyInput"]>
    | NonNullable<CreateProjectRequest["policyInput"]>,
  author: AuthorProfileDoc | null
): Promise<AccessPolicy> {
  return {
    version: ACCESS_POLICY_VERSION as 1,
    root: await buildAccessPolicyNodeFromInput(policyInput.root, author),
  };
}

async function buildAccessPolicyNodeFromInput(
  node:
    | NonNullable<NonNullable<CreateAuthorProfileRequest["defaultPolicyInput"]>["root"]>
    | NonNullable<NonNullable<UpdateAuthorProfileRequest["defaultPolicyInput"]>["root"]>
    | NonNullable<NonNullable<CreatePostRequest["policyInput"]>["root"]>
    | NonNullable<NonNullable<CreateProjectRequest["policyInput"]>["root"]>,
  author: AuthorProfileDoc | null
): Promise<AccessPolicyNode> {
  switch (node.type) {
    case "public":
      return { type: "public" } as const;
    case "subscription": {
      if (!author) {
        throw APIError.invalidArgument(
          "subscription policy input requires an existing author profile"
        );
      }

      const planCode = normalizePlanCode(node.planCode ?? "main");
      const plan = await repo.findSubscriptionPlanByAuthorIdAndCode(
        author._id,
        planCode
      );
      if (!plan) {
        throw APIError.invalidArgument(
          `subscription plan with code '${planCode}' was not found`
        );
      }

      return {
        type: "subscription",
        authorId: author._id.toHexString(),
        planId: plan._id.toHexString(),
      } as const;
    }
    case "token_balance":
      return {
        type: "token_balance",
        chainId: normalizeChainId(node.chainId),
        contractAddress: normalizeWallet(node.contractAddress),
        minAmount: normalizePositiveInteger(node.minAmount, "minAmount"),
        decimals: normalizeTokenDecimals(node.decimals),
      } as const;
    case "nft_ownership":
      return {
        type: "nft_ownership",
        chainId: normalizeChainId(node.chainId),
        contractAddress: normalizeWallet(node.contractAddress),
        standard: normalizeNftStandard(node.standard),
        tokenId: normalizeOptionalIdString(node.tokenId),
        minBalance:
          node.minBalance === undefined
            ? undefined
            : normalizePositiveInteger(node.minBalance, "minBalance"),
      } as const;
    case "or":
      return {
        type: "or",
        children: await Promise.all(
          node.children.map((child) => buildAccessPolicyNodeFromInput(child, author))
        ),
      } as const;
    case "and":
      return {
        type: "and",
        children: await Promise.all(
          node.children.map((child) => buildAccessPolicyNodeFromInput(child, author))
        ),
      } as const;
    default:
      throw APIError.invalidArgument("policy input node type is not supported");
  }
}

function normalizePlanCode(code: string) {
  const value = code.trim().toLowerCase();
  if (!/^[a-z0-9_-]{1,32}$/.test(value)) {
    throw APIError.invalidArgument("planCode is invalid");
  }
  return value;
}

function normalizeTokenDecimals(decimals: number) {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 255) {
    throw APIError.invalidArgument("decimals must be an integer between 0 and 255");
  }
  return decimals;
}

function normalizeNftStandard(standard: string) {
  if (standard !== "erc721" && standard !== "erc1155") {
    throw APIError.invalidArgument("standard must be erc721 or erc1155");
  }
  return standard;
}

function normalizeOptionalIdString(value: string | undefined) {
  if (value === undefined) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    throw APIError.invalidArgument("tokenId is invalid");
  }

  return trimmed;
}
