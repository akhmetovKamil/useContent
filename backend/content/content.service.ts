import { APIError } from "encore.dev/api";
import { id as hashId } from "ethers";
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
import { verifyPlanRegistration, verifySubscriptionPayment } from "./onchain";
import * as repo from "./repository";
import type {
  AccessPolicyPresetDoc,
  AccessPolicyPresetResponse,
  AuthorProfileDoc,
  AuthorProfileResponse,
  ConfirmSubscriptionPaymentRequest,
  ContractDeploymentDoc,
  ContractDeploymentResponse,
  CreateAccessPolicyPresetRequest,
  CreateAuthorProfileRequest,
  CreatePostRequest,
  CreateProjectRequest,
  CreateSubscriptionPaymentIntentRequest,
  PostDoc,
  PostResponse,
  ProjectDoc,
  ProjectResponse,
  SubscriptionPlanDoc,
  SubscriptionPlanResponse,
  SubscriptionEntitlementDoc,
  SubscriptionEntitlementResponse,
  SubscriptionPaymentIntentDoc,
  SubscriptionPaymentIntentResponse,
  UpdateAuthorProfileRequest,
  UpdateAccessPolicyPresetRequest,
  UpsertContractDeploymentRequest,
  UpsertSubscriptionPlanRequest,
  UpdateMyProfileRequest,
  UpdatePostRequest,
  UpdateProjectRequest,
  UserDoc,
  UserProfileResponse,
} from "./types";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

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
    update.tags === undefined ? (author.tags ?? []) : normalizeAuthorTags(update.tags);
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

export async function deleteMyAuthorProfile(walletAddress: string): Promise<void> {
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

export async function listMyAccessPolicyPresets(
  walletAddress: string,
): Promise<AccessPolicyPresetDoc[]> {
  const author = await getMyAuthorProfile(walletAddress);
  return repo.listAccessPolicyPresetsByAuthorId(author._id);
}

export async function createMyAccessPolicyPreset(
  walletAddress: string,
  input: CreateAccessPolicyPresetRequest,
): Promise<AccessPolicyPresetDoc> {
  const author = await getMyAuthorProfile(walletAddress);
  const now = new Date();
  const isDefault = input.isDefault ?? false;
  const policy = await normalizePresetPolicy(
    author,
    input.policy,
    input.policyInput,
  );

  if (isDefault) {
    await repo.clearDefaultAccessPolicyPreset(author._id);
  }

  const preset = await repo.createAccessPolicyPreset({
    authorId: author._id,
    name: normalizePresetName(input.name),
    description: normalizePresetDescription(input.description ?? ""),
    policy,
    isDefault,
    createdAt: now,
    updatedAt: now,
  });

  if (isDefault) {
    await repo.updateAuthorProfile(author._id, {
      defaultPolicy: preset.policy,
      defaultPolicyId: preset._id,
      updatedAt: now,
    });
  }

  return preset;
}

export async function updateMyAccessPolicyPreset(
  walletAddress: string,
  presetId: string,
  input: UpdateAccessPolicyPresetRequest,
): Promise<AccessPolicyPresetDoc> {
  const author = await getMyAuthorProfile(walletAddress);
  const objectId = parseObjectId(presetId, "presetId");
  const existing = await repo.findAccessPolicyPresetByIdAndAuthorId(
    objectId,
    author._id,
  );
  if (!existing) {
    throw APIError.notFound("access policy preset not found");
  }

  const isDefault = input.isDefault ?? existing.isDefault;
  const policy =
    input.policy === undefined && input.policyInput === undefined
      ? existing.policy
      : await normalizePresetPolicy(author, input.policy, input.policyInput);

  if (isDefault) {
    await repo.clearDefaultAccessPolicyPreset(author._id);
  }

  const updated = await repo.updateAccessPolicyPreset(objectId, author._id, {
    name:
      input.name === undefined
        ? existing.name
        : normalizePresetName(input.name),
    description:
      input.description === undefined
        ? existing.description
        : normalizePresetDescription(input.description),
    policy,
    isDefault,
    updatedAt: new Date(),
  });

  if (!updated) {
    throw APIError.notFound("access policy preset not found");
  }

  if (updated.isDefault) {
    await repo.updateAuthorProfile(author._id, {
      defaultPolicy: updated.policy,
      defaultPolicyId: updated._id,
      updatedAt: updated.updatedAt,
    });
  }

  return updated;
}

export async function deleteMyAccessPolicyPreset(
  walletAddress: string,
  presetId: string,
): Promise<void> {
  const author = await getMyAuthorProfile(walletAddress);
  const objectId = parseObjectId(presetId, "presetId");
  const preset = await repo.findAccessPolicyPresetByIdAndAuthorId(
    objectId,
    author._id,
  );
  if (!preset) {
    throw APIError.notFound("access policy preset not found");
  }
  if (preset.isDefault || author.defaultPolicyId?.equals(preset._id)) {
    throw APIError.failedPrecondition(
      "default access policy cannot be deleted",
    );
  }

  const [postCount, projectCount] = await Promise.all([
    repo.countPostsByAccessPolicyId(author._id, objectId),
    repo.countProjectsByAccessPolicyId(author._id, objectId),
  ]);
  if (postCount + projectCount > 0) {
    throw APIError.failedPrecondition("access policy is used by content");
  }

  const deleted = await repo.deleteAccessPolicyPreset(objectId, author._id);
  if (!deleted) {
    throw APIError.notFound("access policy preset not found");
  }
}

export async function listMyEntitlements(
  walletAddress: string,
): Promise<SubscriptionEntitlementDoc[]> {
  const normalizedWallet = normalizeWallet(walletAddress);
  return repo.listSubscriptionEntitlementsByWallet(normalizedWallet);
}

export async function getSubscriptionManagerDeployment(
  chainId: number,
): Promise<ContractDeploymentDoc | null> {
  return repo.findContractDeployment(
    normalizeChainId(chainId),
    "SubscriptionManager",
  );
}

export async function upsertContractDeployment(
  input: UpsertContractDeploymentRequest,
): Promise<ContractDeploymentDoc> {
  const now = new Date();
  return repo.upsertContractDeployment(
    {
      chainId: normalizeChainId(input.chainId),
      contractName: input.contractName,
      address: normalizeWallet(input.address),
      platformTreasury: normalizeWallet(input.platformTreasury),
      deployedBy: normalizeWallet(input.deployedBy),
      deploymentTxHash:
        input.deploymentTxHash === undefined || input.deploymentTxHash === null
          ? null
          : normalizeTxHash(input.deploymentTxHash),
    },
    now,
  );
}

export async function getMySubscriptionPlan(
  walletAddress: string,
): Promise<SubscriptionPlanDoc> {
  const author = await getMyAuthorProfile(walletAddress);
  const plan = await getAuthorMainSubscriptionPlan(author);
  if (!plan) {
    throw APIError.notFound("subscription plan not found");
  }
  return plan;
}

export async function listMySubscriptionPlans(
  walletAddress: string,
): Promise<SubscriptionPlanDoc[]> {
  const author = await getMyAuthorProfile(walletAddress);
  return repo.listSubscriptionPlansByAuthorId(author._id);
}

export async function getAuthorSubscriptionPlanBySlug(
  slug: string,
): Promise<SubscriptionPlanDoc> {
  const author = await getAuthorProfileBySlug(slug);
  const plan = await getAuthorMainSubscriptionPlan(author);
  if (!plan || !plan.active) {
    throw APIError.notFound("subscription plan not found");
  }
  return plan;
}

export async function listAuthorSubscriptionPlansBySlug(
  slug: string,
): Promise<SubscriptionPlanDoc[]> {
  const author = await getAuthorProfileBySlug(slug);
  return repo.listActiveSubscriptionPlansByAuthorId(author._id);
}

export async function upsertMySubscriptionPlan(
  walletAddress: string,
  input: UpsertSubscriptionPlanRequest,
): Promise<SubscriptionPlanDoc> {
  const author = await getMyAuthorProfile(walletAddress);
  const now = new Date();
  const code = normalizePlanCode(input.code ?? "main");
  const title = normalizePlanTitle(input.title);
  const paymentAsset = normalizePaymentAsset(input.paymentAsset ?? "erc20");
  const chainId = normalizeChainId(input.chainId);
  const tokenAddress = normalizePlanTokenAddress(
    paymentAsset,
    input.tokenAddress,
  );
  const price = normalizePositiveInteger(input.price, "price");
  const billingPeriodDays = normalizeBillingPeriodDays(input.billingPeriodDays);
  const contractAddress = normalizeWallet(input.contractAddress);
  const planKey = normalizePlanKey(
    input.planKey ?? buildPlanKey(author._id.toHexString(), code, chainId),
  );
  const registrationTxHash =
    input.registrationTxHash === undefined || input.registrationTxHash === null
      ? null
      : normalizeTxHash(input.registrationTxHash);
  const active = input.active ?? true;

  if (registrationTxHash) {
    await verifyPlanRegistration({
      authorWallet: walletAddress,
      chainId,
      contractAddress,
      planKey,
      paymentAsset,
      tokenAddress,
      price,
      billingPeriodDays,
      active,
      txHash: registrationTxHash,
    });
  }

  const existing = await repo.findSubscriptionPlanByAuthorIdAndCode(
    author._id,
    code,
  );
  if (existing) {
    const updated = await repo.updateSubscriptionPlan(existing._id, {
      title,
      paymentAsset,
      chainId,
      tokenAddress,
      price,
      billingPeriodDays,
      contractAddress,
      planKey,
      registrationTxHash:
        registrationTxHash ?? existing.registrationTxHash ?? null,
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
    code,
    title,
    paymentAsset,
    chainId,
    tokenAddress,
    price,
    billingPeriodDays,
    contractAddress,
    planKey,
    registrationTxHash,
    active,
    createdAt: now,
    updatedAt: now,
  });

  if (code === "main" || !author.subscriptionPlanId) {
    await repo.updateAuthorProfile(author._id, {
      subscriptionPlanId: created._id,
      updatedAt: now,
    });
  }

  return created;
}

export async function deleteMySubscriptionPlan(
  walletAddress: string,
  planId: string,
): Promise<void> {
  const author = await getMyAuthorProfile(walletAddress);
  const objectId = parseObjectId(planId, "planId");
  const plan = await repo.findSubscriptionPlanById(objectId);
  if (!plan || !plan.authorId.equals(author._id)) {
    throw APIError.notFound("subscription plan not found");
  }

  const activeEntitlements =
    await repo.countActiveSubscriptionEntitlementsByPlanId(objectId, new Date());
  if (activeEntitlements > 0) {
    throw APIError.failedPrecondition(
      "subscription plan has active subscribers",
    );
  }

  const deleted = await repo.deleteSubscriptionPlanByIdAndAuthorId(
    objectId,
    author._id,
  );
  if (!deleted) {
    throw APIError.notFound("subscription plan not found");
  }
}

export async function createSubscriptionPaymentIntent(
  walletAddress: string,
  slug: string,
  input: CreateSubscriptionPaymentIntentRequest,
): Promise<SubscriptionPaymentIntentDoc> {
  const subscriberWallet = normalizeWallet(walletAddress);
  const author = await getAuthorProfileBySlug(slug);
  const planCode = normalizePlanCode(input.planCode ?? "main");
  const plan = await repo.findSubscriptionPlanByAuthorIdAndCode(
    author._id,
    planCode,
  );
  if (!plan || !plan.active) {
    throw APIError.notFound("subscription plan not found");
  }

  const now = new Date();
  return repo.createSubscriptionPaymentIntent({
    authorId: author._id,
    subscriberWallet,
    planId: plan._id,
    planCode: plan.code,
    planKey:
      plan.planKey ??
      buildPlanKey(plan.authorId.toHexString(), plan.code, plan.chainId),
    paymentAsset: plan.paymentAsset ?? "erc20",
    chainId: plan.chainId,
    tokenAddress: plan.tokenAddress,
    contractAddress: plan.contractAddress,
    price: plan.price,
    billingPeriodDays: plan.billingPeriodDays,
    status: "pending",
    txHash: null,
    entitlementId: null,
    paidUntil: null,
    expiresAt: addMinutes(now, 30),
    createdAt: now,
    updatedAt: now,
  });
}

export async function confirmSubscriptionPayment(
  walletAddress: string,
  intentId: string,
  input: ConfirmSubscriptionPaymentRequest,
): Promise<SubscriptionPaymentIntentDoc> {
  const subscriberWallet = normalizeWallet(walletAddress);
  const txHash = normalizeTxHash(input.txHash);
  const intent = await repo.findSubscriptionPaymentIntentByIdAndWallet(
    parseObjectId(intentId, "intentId"),
    subscriberWallet,
  );
  if (!intent) {
    throw APIError.notFound("subscription payment intent not found");
  }
  if (intent.status === "cancelled") {
    throw APIError.failedPrecondition(
      "subscription payment intent is cancelled",
    );
  }
  if (intent.status === "expired" || intent.expiresAt.getTime() < Date.now()) {
    const expired = await repo.updateSubscriptionPaymentIntent(intent._id, {
      status: "expired",
      updatedAt: new Date(),
    });
    if (!expired) {
      throw APIError.notFound("subscription payment intent not found");
    }
    return expired;
  }
  if (intent.status === "confirmed") {
    return intent;
  }

  const existingTx = await repo.findSubscriptionPaymentIntentByTxHash(txHash);
  if (existingTx && !existingTx._id.equals(intent._id)) {
    throw APIError.alreadyExists(
      "transaction hash is already attached to payment",
    );
  }

  const payment = await verifySubscriptionPayment({
    subscriberWallet,
    chainId: intent.chainId,
    contractAddress: intent.contractAddress,
    planKey: intent.planKey,
    paymentAsset: intent.paymentAsset ?? "erc20",
    tokenAddress: intent.tokenAddress,
    price: intent.price,
    txHash,
  });
  const now = new Date();
  const entitlement = await repo.upsertActiveSubscriptionEntitlement({
    authorId: intent.authorId,
    subscriberWallet,
    planId: intent.planId,
    validUntil: payment.paidUntil,
    now,
  });

  const updated = await repo.updateSubscriptionPaymentIntent(intent._id, {
    status: "confirmed",
    txHash,
    entitlementId: entitlement._id,
    paidUntil: payment.paidUntil,
    updatedAt: now,
  });

  if (!updated) {
    throw APIError.notFound("subscription payment intent not found");
  }

  return updated;
}

export async function listMySubscriptionPaymentIntents(
  walletAddress: string,
): Promise<SubscriptionPaymentIntentDoc[]> {
  return repo.listSubscriptionPaymentIntentsByWallet(
    normalizeWallet(walletAddress),
  );
}

export async function createMyPost(
  walletAddress: string,
  input: CreatePostRequest,
): Promise<PostDoc> {
  const author = await getMyAuthorProfile(walletAddress);
  const now = new Date();
  const title = normalizePostTitle(input.title);
  const content = normalizePostContent(input.content);
  const status = input.status ?? "draft";
  const policyMode = input.policyMode ?? "inherited";
  const policySelection = await normalizeContentPolicy(
    author,
    input,
    policyMode,
  );
  const attachmentIds = normalizeAttachmentIds(input.attachmentIds ?? []);

  resolveEntityPolicy(policyMode, author.defaultPolicy, policySelection.policy);

  return repo.createPost({
    authorId: author._id,
    title,
    content,
    status,
    policyMode,
    policy: policySelection.policy,
    accessPolicyId: policySelection.accessPolicyId,
    attachmentIds,
    publishedAt: status === "published" ? now : null,
    createdAt: now,
    updatedAt: now,
  });
}

export async function listMyPosts(walletAddress: string): Promise<PostDoc[]> {
  const author = await getMyAuthorProfile(walletAddress);
  return repo.listPostsByAuthorId(author._id);
}

export async function updateMyPost(
  walletAddress: string,
  postId: string,
  input: UpdatePostRequest,
): Promise<PostDoc> {
  const author = await getMyAuthorProfile(walletAddress);
  const objectId = parseObjectId(postId, "postId");
  const existing = await repo.findPostByIdAndAuthorId(objectId, author._id);
  if (!existing) {
    throw APIError.notFound("post not found");
  }

  const nextStatus = input.status ?? existing.status;
  const nextPolicyMode = input.policyMode ?? existing.policyMode;
  const nextPolicySelection =
    input.policyMode === undefined &&
    input.policy === undefined &&
    input.policyInput === undefined &&
    input.accessPolicyId === undefined
      ? { policy: existing.policy, accessPolicyId: existing.accessPolicyId }
      : await normalizeContentPolicy(author, input, nextPolicyMode);

  resolveEntityPolicy(
    nextPolicyMode,
    author.defaultPolicy,
    nextPolicySelection.policy,
  );

  const updated = await repo.updatePost(objectId, author._id, {
    title:
      input.title === undefined
        ? existing.title
        : normalizePostTitle(input.title),
    content:
      input.content === undefined
        ? existing.content
        : normalizePostContent(input.content),
    status: nextStatus,
    policyMode: nextPolicyMode,
    policy: nextPolicySelection.policy,
    accessPolicyId: nextPolicySelection.accessPolicyId,
    attachmentIds:
      input.attachmentIds === undefined
        ? existing.attachmentIds
        : normalizeAttachmentIds(input.attachmentIds),
    publishedAt: resolvePublishedAt(
      existing.publishedAt,
      existing.status,
      nextStatus,
    ),
    updatedAt: new Date(),
  });

  if (!updated) {
    throw APIError.notFound("post not found");
  }

  return updated;
}

export async function deleteMyPost(
  walletAddress: string,
  postId: string,
): Promise<void> {
  const author = await getMyAuthorProfile(walletAddress);
  const deleted = await repo.deletePost(
    parseObjectId(postId, "postId"),
    author._id,
  );
  if (!deleted) {
    throw APIError.notFound("post not found");
  }
}

export async function listAuthorPostsBySlug(slug: string): Promise<PostDoc[]> {
  const author = await getAuthorProfileBySlug(slug);
  return repo.listPublishedPostsByAuthorId(author._id);
}

export async function getAuthorPostBySlugAndId(
  slug: string,
  postId: string,
  viewerWallet?: string,
): Promise<PostDoc> {
  const author = await getAuthorProfileBySlug(slug);
  const objectId = parseObjectId(postId, "postId");
  const post = await repo.findPublishedPostByIdAndAuthorId(
    objectId,
    author._id,
  );
  if (!post) {
    throw APIError.notFound("post not found");
  }

  const resolvedPolicy = resolveEntityPolicy(
    post.policyMode,
    author.defaultPolicy,
    post.policy,
  );

  const evaluation = evaluateAccessPolicy(resolvedPolicy, {
    subscriptions: viewerWallet
      ? await buildSubscriptionGrants(author._id, viewerWallet)
      : [],
    tokenBalances: [],
    nftOwnerships: [],
  });

  if (
    !evaluation.allowed &&
    !(viewerWallet && (await hasActiveAuthorSubscription(author._id, viewerWallet)))
  ) {
    throw APIError.permissionDenied("access to this post is restricted");
  }

  return post;
}

export async function createMyProject(
  walletAddress: string,
  input: CreateProjectRequest,
): Promise<ProjectDoc> {
  const author = await getMyAuthorProfile(walletAddress);
  const now = new Date();
  const projectId = new ObjectId();
  const rootNodeId = new ObjectId();
  const title = normalizeProjectTitle(input.title);
  const description = normalizeProjectDescription(input.description ?? "");
  const status = input.status ?? "draft";
  const policyMode = input.policyMode ?? "inherited";
  const policySelection = await normalizeContentPolicy(
    author,
    input,
    policyMode,
  );

  resolveEntityPolicy(policyMode, author.defaultPolicy, policySelection.policy);

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
    policy: policySelection.policy,
    accessPolicyId: policySelection.accessPolicyId,
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
  walletAddress: string,
): Promise<ProjectDoc[]> {
  const author = await getMyAuthorProfile(walletAddress);
  return repo.listProjectsByAuthorId(author._id);
}

export async function updateMyProject(
  walletAddress: string,
  projectId: string,
  input: UpdateProjectRequest,
): Promise<ProjectDoc> {
  const author = await getMyAuthorProfile(walletAddress);
  const objectId = parseObjectId(projectId, "projectId");
  const existing = await repo.findProjectByIdAndAuthorId(objectId, author._id);
  if (!existing) {
    throw APIError.notFound("project not found");
  }

  const nextStatus = input.status ?? existing.status;
  const nextPolicyMode = input.policyMode ?? existing.policyMode;
  const nextPolicySelection =
    input.policyMode === undefined &&
    input.policy === undefined &&
    input.policyInput === undefined &&
    input.accessPolicyId === undefined
      ? { policy: existing.policy, accessPolicyId: existing.accessPolicyId }
      : await normalizeContentPolicy(author, input, nextPolicyMode);

  resolveEntityPolicy(
    nextPolicyMode,
    author.defaultPolicy,
    nextPolicySelection.policy,
  );

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
    policy: nextPolicySelection.policy,
    accessPolicyId: nextPolicySelection.accessPolicyId,
    publishedAt: resolvePublishedAt(
      existing.publishedAt,
      existing.status,
      nextStatus,
    ),
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
  projectId: string,
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
  slug: string,
): Promise<ProjectDoc[]> {
  const author = await getAuthorProfileBySlug(slug);
  return repo.listPublishedProjectsByAuthorId(author._id);
}

export async function getAuthorProjectBySlugAndId(
  slug: string,
  projectId: string,
  viewerWallet?: string,
): Promise<ProjectDoc> {
  const author = await getAuthorProfileBySlug(slug);
  const objectId = parseObjectId(projectId, "projectId");
  const project = await repo.findPublishedProjectByIdAndAuthorId(
    objectId,
    author._id,
  );
  if (!project) {
    throw APIError.notFound("project not found");
  }

  const resolvedPolicy = resolveEntityPolicy(
    project.policyMode,
    author.defaultPolicy,
    project.policy,
  );

  const evaluation = evaluateAccessPolicy(resolvedPolicy, {
    subscriptions: viewerWallet
      ? await buildSubscriptionGrants(author._id, viewerWallet)
      : [],
    tokenBalances: [],
    nftOwnerships: [],
  });

  if (
    !evaluation.allowed &&
    !(viewerWallet && (await hasActiveAuthorSubscription(author._id, viewerWallet)))
  ) {
    throw APIError.permissionDenied("access to this project is restricted");
  }

  return project;
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
  author: AuthorProfileDoc,
): AuthorProfileResponse {
  return {
    id: author._id.toHexString(),
    userId: author.userId,
    slug: author.slug,
    displayName: author.displayName,
    bio: author.bio,
    tags: author.tags ?? [],
    avatarFileId: author.avatarFileId?.toHexString() ?? null,
    defaultPolicy: author.defaultPolicy,
    defaultPolicyId: author.defaultPolicyId?.toHexString() ?? null,
    subscriptionPlanId: author.subscriptionPlanId?.toHexString() ?? null,
    createdAt: author.createdAt.toISOString(),
    updatedAt: author.updatedAt.toISOString(),
  };
}

export function toAccessPolicyPresetResponse(
  preset: AccessPolicyPresetDoc,
): AccessPolicyPresetResponse {
  return {
    id: preset._id.toHexString(),
    authorId: preset.authorId.toHexString(),
    name: preset.name,
    description: preset.description,
    policy: preset.policy,
    isDefault: preset.isDefault,
    createdAt: preset.createdAt.toISOString(),
    updatedAt: preset.updatedAt.toISOString(),
  };
}

export function toSubscriptionEntitlementResponse(
  entitlement: SubscriptionEntitlementDoc,
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

export function toContractDeploymentResponse(
  deployment: ContractDeploymentDoc,
): ContractDeploymentResponse {
  return {
    id: deployment._id.toHexString(),
    chainId: deployment.chainId,
    contractName: deployment.contractName,
    address: deployment.address,
    platformTreasury: deployment.platformTreasury,
    deployedBy: deployment.deployedBy,
    deploymentTxHash: deployment.deploymentTxHash,
    createdAt: deployment.createdAt.toISOString(),
    updatedAt: deployment.updatedAt.toISOString(),
  };
}

export function toSubscriptionPaymentIntentResponse(
  intent: SubscriptionPaymentIntentDoc,
): SubscriptionPaymentIntentResponse {
  return {
    id: intent._id.toHexString(),
    authorId: intent.authorId.toHexString(),
    subscriberWallet: intent.subscriberWallet,
    planId: intent.planId.toHexString(),
    planCode: intent.planCode,
    planKey: intent.planKey,
    paymentAsset: intent.paymentAsset ?? "erc20",
    chainId: intent.chainId,
    tokenAddress: intent.tokenAddress,
    contractAddress: intent.contractAddress,
    price: intent.price,
    billingPeriodDays: intent.billingPeriodDays,
    status: intent.status,
    txHash: intent.txHash,
    entitlementId: intent.entitlementId?.toHexString() ?? null,
    paidUntil: intent.paidUntil?.toISOString() ?? null,
    expiresAt: intent.expiresAt.toISOString(),
    createdAt: intent.createdAt.toISOString(),
    updatedAt: intent.updatedAt.toISOString(),
  };
}

export function toSubscriptionPlanResponse(
  plan: SubscriptionPlanDoc,
): SubscriptionPlanResponse {
  return {
    id: plan._id.toHexString(),
    authorId: plan.authorId.toHexString(),
    code: plan.code,
    title: plan.title,
    paymentAsset: plan.paymentAsset ?? "erc20",
    chainId: plan.chainId,
    tokenAddress: plan.tokenAddress,
    price: plan.price,
    billingPeriodDays: plan.billingPeriodDays,
    contractAddress: plan.contractAddress,
    planKey:
      plan.planKey ??
      buildPlanKey(plan.authorId.toHexString(), plan.code, plan.chainId),
    registrationTxHash: plan.registrationTxHash ?? null,
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
    accessPolicyId: post.accessPolicyId?.toHexString() ?? null,
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
    accessPolicyId: project.accessPolicyId?.toHexString() ?? null,
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

function isMongoDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === 11000
  );
}

function normalizePaymentAsset(value: string): "erc20" | "native" {
  if (value === "erc20" || value === "native") {
    return value;
  }

  throw APIError.invalidArgument("paymentAsset must be erc20 or native");
}

function normalizePlanTokenAddress(
  paymentAsset: "erc20" | "native",
  tokenAddress: string,
): string {
  if (paymentAsset === "native") {
    return ZERO_ADDRESS;
  }

  const normalized = normalizeWallet(tokenAddress);
  if (normalized === ZERO_ADDRESS) {
    throw APIError.invalidArgument("ERC-20 token address is required");
  }

  return normalized;
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

function normalizeAuthorTags(tags: string[]): string[] {
  if (!Array.isArray(tags)) {
    throw APIError.invalidArgument("tags must be an array");
  }

  const normalized = tags
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean)
    .filter((tag, index, list) => list.indexOf(tag) === index);

  if (normalized.length > 12) {
    throw APIError.invalidArgument("author can have up to 12 tags");
  }

  for (const tag of normalized) {
    if (!/^[a-z0-9- ]{2,32}$/.test(tag)) {
      throw APIError.invalidArgument(
        "tags must be 2-32 chars: a-z, 0-9, space, -",
      );
    }
  }

  return normalized;
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

function normalizePresetName(name: string): string {
  const value = name.trim();
  if (!value) {
    throw APIError.invalidArgument("access policy name is required");
  }
  if (value.length > 120) {
    throw APIError.invalidArgument("access policy name is too long");
  }
  return value;
}

function normalizePresetDescription(description: string): string {
  const value = description.trim();
  if (value.length > 500) {
    throw APIError.invalidArgument("access policy description is too long");
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
      "billingPeriodDays must be an integer between 1 and 3650",
    );
  }
  return days;
}

function normalizePositiveInteger(value: string, field: string): string {
  const normalized = value.trim();
  if (!/^[0-9]+$/.test(normalized)) {
    throw APIError.invalidArgument(
      `${field} must be a positive integer string`,
    );
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

async function normalizeContentPolicy(
  author: AuthorProfileDoc,
  input:
    | CreatePostRequest
    | UpdatePostRequest
    | CreateProjectRequest
    | UpdateProjectRequest,
  policyMode: NonNullable<
    | CreatePostRequest["policyMode"]
    | UpdatePostRequest["policyMode"]
    | CreateProjectRequest["policyMode"]
    | UpdateProjectRequest["policyMode"]
  >,
): Promise<{ policy: AccessPolicy | null; accessPolicyId: ObjectId | null }> {
  if (policyMode !== "custom") {
    return { policy: null, accessPolicyId: null };
  }

  if (input.accessPolicyId) {
    if (input.policy !== undefined || input.policyInput !== undefined) {
      throw APIError.invalidArgument(
        "provide either accessPolicyId or inline policy",
      );
    }

    const preset = await repo.findAccessPolicyPresetByIdAndAuthorId(
      parseObjectId(input.accessPolicyId, "accessPolicyId"),
      author._id,
    );
    if (!preset) {
      throw APIError.notFound("access policy preset not found");
    }

    return { policy: preset.policy, accessPolicyId: preset._id };
  }

  return {
    policy: await normalizeRequestedCustomPolicy(
      author,
      input.policy ?? null,
      input.policyInput,
    ),
    accessPolicyId: null,
  };
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

async function normalizeRequestedAuthorDefaultPolicy(
  author: AuthorProfileDoc | null,
  policy:
    | CreateAuthorProfileRequest["defaultPolicy"]
    | UpdateAuthorProfileRequest["defaultPolicy"],
  policyInput:
    | CreateAuthorProfileRequest["defaultPolicyInput"]
    | UpdateAuthorProfileRequest["defaultPolicyInput"],
) {
  if (policy !== undefined && policyInput !== undefined) {
    throw APIError.invalidArgument(
      "provide either defaultPolicy or defaultPolicyInput",
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

async function resolveDefaultPolicyFromPreset(
  author: AuthorProfileDoc,
  presetId: string | null,
): Promise<AccessPolicy> {
  if (!presetId) {
    return createPublicPolicy();
  }

  const preset = await repo.findAccessPolicyPresetByIdAndAuthorId(
    parseObjectId(presetId, "defaultPolicyId"),
    author._id,
  );
  if (!preset) {
    throw APIError.notFound("access policy preset not found");
  }
  return preset.policy;
}

async function normalizePresetPolicy(
  author: AuthorProfileDoc,
  policy:
    | CreateAccessPolicyPresetRequest["policy"]
    | UpdateAccessPolicyPresetRequest["policy"],
  policyInput:
    | CreateAccessPolicyPresetRequest["policyInput"]
    | UpdateAccessPolicyPresetRequest["policyInput"],
) {
  if (policy !== undefined && policyInput !== undefined) {
    throw APIError.invalidArgument("provide either policy or policyInput");
  }
  if (policyInput !== undefined) {
    return buildAccessPolicyFromInput(policyInput, author);
  }
  return normalizeAccessPolicy(policy ?? createPublicPolicy(), "access policy");
}

async function normalizeRequestedCustomPolicy(
  author: AuthorProfileDoc,
  policy: CreatePostRequest["policy"] | CreateProjectRequest["policy"],
  policyInput:
    | CreatePostRequest["policyInput"]
    | CreateProjectRequest["policyInput"],
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
  nextStatus: "draft" | "published",
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
  viewerWallet: string,
) {
  const entitlements =
    await repo.listSubscriptionEntitlementsByWalletAndAuthorId(
      normalizeWallet(viewerWallet),
      authorId,
    );

  return entitlements.map((entitlement) => ({
    authorId: entitlement.authorId.toHexString(),
    planId: entitlement.planId.toHexString(),
    active:
      entitlement.status === "active" &&
      entitlement.validUntil.getTime() > Date.now(),
  }));
}

async function hasActiveAuthorSubscription(
  authorId: ObjectId,
  viewerWallet: string,
): Promise<boolean> {
  const entitlements =
    await repo.listSubscriptionEntitlementsByWalletAndAuthorId(
      normalizeWallet(viewerWallet),
      authorId,
    );

  return entitlements.some(
    (entitlement) =>
      entitlement.status === "active" &&
      entitlement.validUntil.getTime() > Date.now(),
  );
}

function shortenWallet(walletAddress: string): string {
  if (walletAddress.length <= 10) {
    return walletAddress;
  }

  return `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
}

async function getAuthorMainSubscriptionPlan(
  author: AuthorProfileDoc,
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
  author: AuthorProfileDoc | null,
): Promise<AccessPolicy> {
  return {
    version: ACCESS_POLICY_VERSION as 1,
    root: await buildAccessPolicyNodeFromInput(policyInput.root, author),
  };
}

async function buildAccessPolicyNodeFromInput(
  node:
    | NonNullable<
        NonNullable<CreateAuthorProfileRequest["defaultPolicyInput"]>["root"]
      >
    | NonNullable<
        NonNullable<UpdateAuthorProfileRequest["defaultPolicyInput"]>["root"]
      >
    | NonNullable<NonNullable<CreatePostRequest["policyInput"]>["root"]>
    | NonNullable<NonNullable<CreateProjectRequest["policyInput"]>["root"]>,
  author: AuthorProfileDoc | null,
): Promise<AccessPolicyNode> {
  switch (node.type) {
    case "public":
      return { type: "public" } as const;
    case "subscription": {
      if (!author) {
        throw APIError.invalidArgument(
          "subscription policy input requires an existing author profile",
        );
      }

      const planCode = normalizePlanCode(node.planCode ?? "main");
      const plan = await repo.findSubscriptionPlanByAuthorIdAndCode(
        author._id,
        planCode,
      );
      if (!plan) {
        throw APIError.invalidArgument(
          `subscription plan with code '${planCode}' was not found`,
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
          node.children.map((child) =>
            buildAccessPolicyNodeFromInput(child, author),
          ),
        ),
      } as const;
    case "and":
      return {
        type: "and",
        children: await Promise.all(
          node.children.map((child) =>
            buildAccessPolicyNodeFromInput(child, author),
          ),
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
    throw APIError.invalidArgument(
      "decimals must be an integer between 0 and 255",
    );
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

function normalizeTxHash(txHash: string): string {
  const value = txHash.trim().toLowerCase();
  if (!/^0x[a-f0-9]{64}$/.test(value)) {
    throw APIError.invalidArgument(
      "txHash must be a 32-byte hex transaction hash",
    );
  }
  return value;
}

function normalizePlanKey(planKey: string): string {
  const value = planKey.trim().toLowerCase();
  if (!/^0x[a-f0-9]{64}$/.test(value)) {
    throw APIError.invalidArgument("planKey must be a 32-byte hex value");
  }
  return value;
}

function buildPlanKey(authorId: string, code: string, chainId: number): string {
  return hashId(`usecontent:${chainId}:${authorId}:${code}`).toLowerCase();
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}
