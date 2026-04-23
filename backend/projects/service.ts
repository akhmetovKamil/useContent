import { APIError } from "encore.dev/api";
import { id as hashId } from "ethers";
import { ObjectId } from "mongodb";
import { ZERO_ADDRESS } from "../../shared/consts";
import {
  ACCESS_POLICY_VERSION,
  type AccessPolicy,
  type AccessEvaluationContext,
  type AccessPolicyNode,
  createPublicPolicy,
  evaluateAccessPolicy,
  isAccessPolicy,
  resolveEntityPolicy,
} from "../domain/access";
import {
  createProjectFileStorageKey,
  deleteProjectFile,
  uploadProjectFile,
} from "./file-storage";
import {
  readOnChainAccessGrants,
  verifyPlatformSubscriptionPayment,
  verifyPlanRegistration,
  verifySubscriptionPayment,
} from "../content/onchain";
import * as accessRepo from "../access/repository";
import * as contractDeploymentsRepo from "../lib/contract-deployments.repository";
import * as platformRepo from "../platform/repository";
import * as postsRepo from "../posts/repository";
import * as profilesRepo from "../profiles/repository";
import * as projectsRepo from "../projects/repository";
import * as subscriptionsRepo from "../subscriptions/repository";

const repo = {
  ...accessRepo,
  ...contractDeploymentsRepo,
  ...platformRepo,
  ...postsRepo,
  ...profilesRepo,
  ...projectsRepo,
  ...subscriptionsRepo,
};
import type {
  AccessPolicyPresetDoc,
  AccessPolicyConditionResponse,
  AccessPolicyPresetResponse,
  AuthorAccessPolicyResponse,
  AuthorCatalogItemResponse,
  AuthorProfileDoc,
  AuthorProfileResponse,
  AuthorSubscriberResponse,
  AuthorPlatformBillingResponse,
  AuthorPlatformCleanupItemResponse,
  AuthorPlatformCleanupPreviewResponse,
  AuthorPlatformCleanupRunResponse,
  ConfirmSubscriptionPaymentRequest,
  AuthorStorageUsageResponse,
  AuthorStorageUsageStats,
  ContractDeploymentDoc,
  ContractDeploymentResponse,
  CreateAccessPolicyPresetRequest,
  CreateAuthorProfileRequest,
  CreatePlatformSubscriptionPaymentIntentRequest,
  CreatePostRequest,
  CreateProjectFolderRequest,
  CreateProjectRequest,
  CreatePostCommentRequest,
  CreateSubscriptionPaymentIntentRequest,
  FeedPostResponse,
  FeedProjectResponse,
  PostDoc,
  PostCommentDoc,
  PostCommentResponse,
  PostAttachmentDoc,
  PostAttachmentResponse,
  PostResponse,
  ProjectDoc,
  ProjectBundleResponse,
  ProjectNodeDoc,
  ProjectNodeListResponse,
  ProjectNodeResponse,
  ProjectResponse,
  PlatformFeature,
  PlatformPlanResponse,
  PlatformPlanDoc,
  PlatformSubscriptionPaymentIntentDoc,
  PlatformSubscriptionPaymentIntentResponse,
  ReaderSubscriptionResponse,
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
  UpdateProjectNodeRequest,
  UpdateProjectRequest,
  UserDoc,
  UserProfileResponse,
} from "../lib/content-types";
import {
  toUserProfileResponse,
  toAuthorProfileResponse,
  toAuthorStorageUsageResponse,
  toAccessPolicyPresetResponse,
  toAccessPolicyPresetResponseWithUsage,
  toSubscriptionEntitlementResponse,
  toContractDeploymentResponse,
  toSubscriptionPaymentIntentResponse,
  toPlatformSubscriptionPaymentIntentResponse,
  toSubscriptionPlanResponse,
  toSubscriptionPlanResponseWithStats,
  toPostResponse,
  toPostAttachmentResponse,
  toPostCommentResponse,
  buildPostResponse,
  toFeedPostResponse,
  buildFeedPostResponse,
  describeAccessPolicy,
  describeAccessPolicyNode,
  toProjectResponse,
  buildProjectResponse,
  toProjectNodeResponse,
  toFeedProjectResponse,
  buildFeedProjectResponse,
  normalizeWallet,
  isMongoDuplicateKeyError,
  normalizePaymentAsset,
  normalizePlanTokenAddress,
  normalizeUsername,
  normalizeDisplayName,
  normalizeBio,
  normalizeAuthorTags,
  normalizeSlug,
  normalizePlanTitle,
  normalizePresetName,
  normalizePresetDescription,
  normalizeChainId,
  normalizeBillingPeriodDays,
  normalizePositiveInteger,
  normalizePostTitle,
  normalizePostContent,
  normalizePostCommentContent,
  normalizeContentPolicy,
  normalizeAccessPolicy,
  normalizeProjectTitle,
  normalizeProjectDescription,
  normalizeProjectNodeName,
  getMyProjectContext,
  resolveProjectNode,
  resolveProjectFolder,
  buildProjectBreadcrumbs,
  buildProjectBundle,
  getReadablePostContext,
  buildPostStats,
  assertPublishedProjectPath,
  readProjectFileObject,
  normalizeRequestedAuthorDefaultPolicy,
  resolveDefaultPolicyFromPreset,
  normalizePresetPolicy,
  normalizeRequestedCustomPolicy,
  resolvePublishedAt,
  normalizeAttachmentIds,
  normalizeLinkedProjectIds,
  resolvePostAttachmentKind,
  resolvePostAttachment,
  readPostAttachmentObject,
  parseObjectId,
  uniqueObjectIds,
  buildSubscriptionGrants,
  buildAccessEvaluationContext,
  policyUsesSubscriptionPlan,
  buildAccessPolicyConditionResponses,
  collectPolicyConditionNodes,
  collectSubscriptionPlanIds,
  getConditionMode,
  shortenWallet,
  buildAccessPolicyFromInput,
  buildAccessPolicyNodeFromInput,
  normalizePlanCode,
  normalizeTokenDecimals,
  normalizeNftStandard,
  normalizeOptionalIdString,
  normalizeTxHash,
  normalizePlanKey,
  buildPlanKey,
  addMinutes,
} from "../lib/content-common";

export * from "../lib/content-common";
import { getAuthorProfileBySlug, getMyAuthorProfile, getOrCreateUserByWallet } from "../profiles/service";
import { assertAuthorPlatformFeature, assertAuthorStorageQuota } from "../platform/service";
export async function createMyProject(
  walletAddress: string,
  input: CreateProjectRequest,
): Promise<ProjectDoc> {
  const author = await getMyAuthorProfile(walletAddress);
  await assertAuthorPlatformFeature(author, "projects");
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

export async function listMyArchivedProjects(
  walletAddress: string,
): Promise<ProjectDoc[]> {
  const author = await getMyAuthorProfile(walletAddress);
  return repo.listProjectsByAuthorId(author._id, "archived");
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
      await deleteProjectFile(node.storageKey);
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
  viewerWallet?: string,
): Promise<FeedProjectResponse[]> {
  const author = await getAuthorProfileBySlug(slug);
  const projects = await repo.listPublishedProjectsByAuthorId(author._id);
  return Promise.all(
    projects.map((project) =>
      buildFeedProjectResponse(
        project,
        author,
        viewerWallet ? normalizeWallet(viewerWallet) : undefined,
      ),
    ),
  );
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

  const evaluation = evaluateAccessPolicy(
    resolvedPolicy,
    await buildAccessEvaluationContext(
      author._id,
      resolvedPolicy,
      viewerWallet,
    ),
  );

  if (!evaluation.allowed) {
    throw APIError.permissionDenied("access to this project is restricted");
  }

  return project;
}

export async function listMyProjectNodes(
  walletAddress: string,
  projectId: string,
  parentId?: string | null,
): Promise<ProjectNodeListResponse> {
  const { project } = await getMyProjectContext(walletAddress, projectId);
  const currentFolder = await resolveProjectFolder(
    project,
    parentId ?? project.rootNodeId.toHexString(),
  );
  const nodes = await repo.listProjectNodesByParent(
    project._id,
    currentFolder._id,
  );

  return {
    nodes: nodes.map(toProjectNodeResponse),
    currentFolderId: currentFolder._id.toHexString(),
    breadcrumbs: (await buildProjectBreadcrumbs(project, currentFolder)).map(
      toProjectNodeResponse,
    ),
  };
}

export async function listAuthorProjectNodesBySlug(
  slug: string,
  projectId: string,
  parentId?: string | null,
  viewerWallet?: string,
): Promise<ProjectNodeListResponse> {
  const project = await getAuthorProjectBySlugAndId(
    slug,
    projectId,
    viewerWallet,
  );
  const currentFolder = await resolveProjectFolder(
    project,
    parentId ?? project.rootNodeId.toHexString(),
  );
  await assertPublishedProjectPath(project, currentFolder);
  const nodes = await repo.listPublishedProjectNodesByParent(
    project._id,
    currentFolder._id,
  );

  return {
    nodes: nodes.map(toProjectNodeResponse),
    currentFolderId: currentFolder._id.toHexString(),
    breadcrumbs: (await buildProjectBreadcrumbs(project, currentFolder)).map(
      toProjectNodeResponse,
    ),
  };
}

export async function getMyProjectBundle(
  walletAddress: string,
  projectId: string,
  folderId?: string | null,
): Promise<ProjectBundleResponse> {
  const { project } = await getMyProjectContext(walletAddress, projectId);
  const folder = await resolveProjectFolder(
    project,
    folderId ?? project.rootNodeId.toHexString(),
  );
  return buildProjectBundle(project, folder, false);
}

export async function getAuthorProjectBundleBySlug(
  slug: string,
  projectId: string,
  folderId?: string | null,
  viewerWallet?: string,
): Promise<ProjectBundleResponse> {
  const project = await getAuthorProjectBySlugAndId(
    slug,
    projectId,
    viewerWallet,
  );
  const folder = await resolveProjectFolder(
    project,
    folderId ?? project.rootNodeId.toHexString(),
  );
  await assertPublishedProjectPath(project, folder);
  return buildProjectBundle(project, folder, true);
}

export async function createMyProjectFolder(
  walletAddress: string,
  projectId: string,
  input: CreateProjectFolderRequest,
): Promise<ProjectNodeDoc> {
  const { author, project } = await getMyProjectContext(
    walletAddress,
    projectId,
  );
  const parent = await resolveProjectFolder(
    project,
    input.parentId ?? project.rootNodeId.toHexString(),
  );
  const now = new Date();

  return repo.createProjectNode({
    _id: new ObjectId(),
    authorId: author._id,
    projectId: project._id,
    parentId: parent._id,
    kind: "folder",
    name: normalizeProjectNodeName(input.name),
    storageKey: null,
    mimeType: null,
    size: null,
    visibility: input.visibility ?? "published",
    createdAt: now,
    updatedAt: now,
  });
}

export async function uploadMyProjectFile(
  walletAddress: string,
  projectId: string,
  input: {
    parentId?: string | null;
    name: string;
    body: Buffer;
    contentType: string;
  },
): Promise<ProjectNodeDoc> {
  const { author, project } = await getMyProjectContext(
    walletAddress,
    projectId,
  );
  await assertAuthorStorageQuota(author, input.body.length);
  const parent = await resolveProjectFolder(
    project,
    input.parentId ?? project.rootNodeId.toHexString(),
  );
  const now = new Date();
  const nodeId = new ObjectId();
  const name = normalizeProjectNodeName(input.name);
  const storageKey = createProjectFileStorageKey({
    authorId: author._id.toHexString(),
    projectId: project._id.toHexString(),
    nodeId: nodeId.toHexString(),
    fileName: name,
  });

  await uploadProjectFile(
    storageKey,
    input.body,
    input.contentType || "application/octet-stream",
  );

  return repo.createProjectNode({
    _id: nodeId,
    authorId: author._id,
    projectId: project._id,
    parentId: parent._id,
    kind: "file",
    name,
    storageKey,
    mimeType: input.contentType || "application/octet-stream",
    size: input.body.length,
    visibility: "published",
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateMyProjectNode(
  walletAddress: string,
  projectId: string,
  nodeId: string,
  input: UpdateProjectNodeRequest,
): Promise<ProjectNodeDoc> {
  const { project } = await getMyProjectContext(walletAddress, projectId);
  const node = await resolveProjectNode(project, nodeId);
  if (node._id.equals(project.rootNodeId)) {
    throw APIError.invalidArgument("project root cannot be updated here");
  }

  const update: Parameters<typeof repo.updateProjectNode>[2] = {
    updatedAt: new Date(),
  };

  if (input.name !== undefined) {
    update.name = normalizeProjectNodeName(input.name);
  }

  if (input.visibility !== undefined) {
    update.visibility = input.visibility;
  }

  if (input.parentId !== undefined) {
    const parent = await resolveProjectFolder(project, input.parentId);
    if (parent._id.equals(node._id)) {
      throw APIError.invalidArgument("folder cannot be moved into itself");
    }
    update.parentId = parent._id;
  }

  const updated = await repo.updateProjectNode(node._id, project._id, update);
  if (!updated) {
    throw APIError.notFound("project node not found");
  }

  return updated;
}

export async function deleteMyProjectNode(
  walletAddress: string,
  projectId: string,
  nodeId: string,
): Promise<void> {
  const { project } = await getMyProjectContext(walletAddress, projectId);
  const node = await resolveProjectNode(project, nodeId);
  if (node._id.equals(project.rootNodeId)) {
    throw APIError.invalidArgument("project root cannot be deleted");
  }

  const descendants =
    node.kind === "folder"
      ? await repo.findProjectNodeChildrenRecursive(project._id, node._id)
      : [];
  const nodesToDelete = [node, ...descendants];

  for (const item of nodesToDelete) {
    if (item.kind === "file" && item.storageKey) {
      await deleteProjectFile(item.storageKey);
    }
  }

  await repo.deleteProjectNodes(nodesToDelete.map((item) => item._id));
}

export async function getMyProjectFile(
  walletAddress: string,
  projectId: string,
  nodeId: string,
): Promise<{ body: Buffer; contentType: string; fileName: string }> {
  const { project } = await getMyProjectContext(walletAddress, projectId);
  const node = await resolveProjectNode(project, nodeId);
  return readProjectFileObject(node);
}

export async function getAuthorProjectFileBySlug(
  slug: string,
  projectId: string,
  nodeId: string,
  viewerWallet?: string,
): Promise<{ body: Buffer; contentType: string; fileName: string }> {
  const project = await getAuthorProjectBySlugAndId(
    slug,
    projectId,
    viewerWallet,
  );
  const node = await resolveProjectNode(project, nodeId);
  if (node.visibility !== "published") {
    throw APIError.permissionDenied("access to this file is restricted");
  }
  if (node.parentId) {
    const parent = await resolveProjectFolder(
      project,
      node.parentId.toHexString(),
    );
    await assertPublishedProjectPath(project, parent);
  }
  return readProjectFileObject(node);
}
