import { ObjectId } from "mongodb";
import { APIError } from "encore.dev/api";
import {
  createProjectObjectKey,
  deleteObject,
  getObject,
  putObject,
} from "../storage/object-storage";
import * as contentService from "../lib/content-core";
import * as contentRepo from "../lib/content-repository";
import * as repo from "./repository";
import type { FileDoc, FileResponse, ProjectNodeResponse } from "./types";
import type { ProjectDoc, ProjectNodeDoc } from "../lib/content-types";

export function toResponse(doc: FileDoc): FileResponse {
  return {
    id: doc._id.toHexString(),
    name: doc.name,
    type: doc.type,
    parentId: doc.parentId?.toHexString() ?? null,
    storageKey: doc.storageKey,
    mimeType: doc.mimeType,
    size: doc.size,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export async function createFolder(
  walletAddress: string,
  name: string,
  parentId: string | null
): Promise<FileDoc> {
  return repo.createFile({
    walletAddress,
    name,
    type: "folder",
    parentId: parentId ? new ObjectId(parentId) : null,
    storageKey: null,
    mimeType: null,
    size: null,
  });
}

export async function uploadFile(
  walletAddress: string,
  name: string,
  parentId: string | null,
  body: Buffer,
  contentType: string
): Promise<FileDoc> {
  const doc = await repo.createFile({
    walletAddress,
    name,
    type: "file",
    parentId: parentId ? new ObjectId(parentId) : null,
    storageKey: null,
    mimeType: contentType,
    size: body.length,
  });

  const storageKey = `${walletAddress}/${doc._id.toHexString()}/${name}`;
  await putObject(storageKey, body, contentType);

  const updated = await repo.updateFile(doc._id.toHexString(), { storageKey });
  return updated ?? { ...doc, storageKey };
}

export async function downloadFile(
  walletAddress: string,
  fileId: string
): Promise<{ body: Buffer; contentType: string; name: string }> {
  const doc = await repo.findById(fileId);
  if (!doc || doc.walletAddress !== walletAddress) {
    throw new Error("not_found");
  }
  if (doc.type !== "file" || !doc.storageKey) {
    throw new Error("not_a_file");
  }

  const object = await getObject(doc.storageKey);

  return {
    body: object.body,
    contentType: doc.mimeType || object.contentType,
    name: doc.name,
  };
}

export async function deleteFileOrFolder(
  walletAddress: string,
  fileId: string
): Promise<void> {
  const doc = await repo.findById(fileId);
  if (!doc || doc.walletAddress !== walletAddress) {
    throw new Error("not_found");
  }

  if (doc.type === "folder") {
    const children = await repo.findChildrenRecursive(walletAddress, doc._id);
    for (const child of children) {
      if (child.type === "file" && child.storageKey) {
        await deleteObject(child.storageKey);
      }
      await repo.deleteById(child._id.toHexString());
    }
  } else if (doc.storageKey) {
    await deleteObject(doc.storageKey);
  }

  await repo.deleteById(fileId);
}

export async function listFiles(
  walletAddress: string,
  parentId: string | null
): Promise<FileDoc[]> {
  return repo.listByParent(
    walletAddress,
    parentId ? new ObjectId(parentId) : null
  );
}

export async function updateFileOrFolder(
  walletAddress: string,
  fileId: string,
  update: { name?: string; parentId?: string | null }
): Promise<FileDoc> {
  const doc = await repo.findById(fileId);
  if (!doc || doc.walletAddress !== walletAddress) {
    throw new Error("not_found");
  }

  const mongoUpdate: Partial<Pick<FileDoc, "name" | "parentId">> = {};
  if (update.name !== undefined) mongoUpdate.name = update.name;
  if (update.parentId !== undefined) {
    mongoUpdate.parentId = update.parentId
      ? new ObjectId(update.parentId)
      : null;
  }

  const updated = await repo.updateFile(fileId, mongoUpdate);
  if (!updated) throw new Error("not_found");
  return updated;
}

export function toProjectNodeResponse(node: ProjectNodeDoc): ProjectNodeResponse {
  return {
    id: node._id.toHexString(),
    authorId: node.authorId.toHexString(),
    projectId: node.projectId.toHexString(),
    parentId: node.parentId?.toHexString() ?? null,
    kind: node.kind,
    name: node.name,
    storageKey: node.storageKey,
    mimeType: node.mimeType,
    size: node.size,
    visibility: node.visibility,
    createdAt: node.createdAt.toISOString(),
    updatedAt: node.updatedAt.toISOString(),
  };
}

export async function listMyProjectNodes(
  walletAddress: string,
  projectId: string,
  parentId?: string | null
): Promise<ProjectNodeDoc[]> {
  const { author, project } = await getMyProjectContext(walletAddress, projectId);
  const parentObjectId = await resolveParentId(author._id, project, parentId ?? null);
  return contentRepo.listProjectNodesByParent(project._id, parentObjectId);
}

export async function createMyProjectFolder(
  walletAddress: string,
  projectId: string,
  input: { name: string; parentId?: string | null; visibility?: "author" | "published" }
): Promise<ProjectNodeDoc> {
  const { author, project } = await getMyProjectContext(walletAddress, projectId);
  const parentObjectId = await resolveParentId(author._id, project, input.parentId ?? null);
  const now = new Date();

  return contentRepo.createProjectNode({
    _id: new ObjectId(),
    authorId: author._id,
    projectId: project._id,
    parentId: parentObjectId,
    kind: "folder",
    name: normalizeNodeName(input.name),
    storageKey: null,
    mimeType: null,
    size: null,
    visibility: normalizeVisibility(input.visibility),
    createdAt: now,
    updatedAt: now,
  });
}

export async function uploadMyProjectFile(
  walletAddress: string,
  projectId: string,
  input: {
    fileName: string;
    parentId?: string | null;
    body: Buffer;
    contentType: string;
    visibility?: "author" | "published";
  }
): Promise<ProjectNodeDoc> {
  const { author, project } = await getMyProjectContext(walletAddress, projectId);
  const parentObjectId = await resolveParentId(author._id, project, input.parentId ?? null);
  const now = new Date();
  const nodeId = new ObjectId();
  const name = normalizeNodeName(input.fileName);
  const storageKey = createProjectObjectKey({
    authorId: author._id.toHexString(),
    projectId: project._id.toHexString(),
    nodeId: nodeId.toHexString(),
    fileName: name,
  });

  await putObject(storageKey, input.body, normalizeContentType(input.contentType));

  return contentRepo.createProjectNode({
    _id: nodeId,
    authorId: author._id,
    projectId: project._id,
    parentId: parentObjectId,
    kind: "file",
    name,
    storageKey,
    mimeType: normalizeContentType(input.contentType),
    size: input.body.length,
    visibility: normalizeVisibility(input.visibility),
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateMyProjectNode(
  walletAddress: string,
  projectId: string,
  nodeId: string,
  input: { name?: string; parentId?: string | null; visibility?: "author" | "published" }
): Promise<ProjectNodeDoc> {
  const { author, project } = await getMyProjectContext(walletAddress, projectId);
  const node = await getProjectNodeForAuthor(author._id, project._id, nodeId);
  if (node._id.equals(project.rootNodeId)) {
    throw APIError.invalidArgument("root node cannot be updated from files API");
  }

  const update: Partial<Pick<ProjectNodeDoc, "name" | "parentId" | "visibility" | "updatedAt">> = {
    updatedAt: new Date(),
  };

  if (input.name !== undefined) {
    update.name = normalizeNodeName(input.name);
  }
  if (input.parentId !== undefined) {
    update.parentId = await resolveParentId(author._id, project, input.parentId);
    if (update.parentId?.equals(node._id)) {
      throw APIError.invalidArgument("node cannot be moved into itself");
    }
    if (node.kind === "folder") {
      const descendants = await contentRepo.findProjectNodeChildrenRecursive(
        project._id,
        node._id
      );
      if (descendants.some((descendant) => descendant._id.equals(update.parentId))) {
        throw APIError.invalidArgument("folder cannot be moved into its child");
      }
    }
  }
  if (input.visibility !== undefined) {
    update.visibility = normalizeVisibility(input.visibility);
  }

  const updated = await contentRepo.updateProjectNode(node._id, project._id, update);
  if (!updated) {
    throw APIError.notFound("project node not found");
  }

  return updated;
}

export async function deleteMyProjectNode(
  walletAddress: string,
  projectId: string,
  nodeId: string
): Promise<void> {
  const { author, project } = await getMyProjectContext(walletAddress, projectId);
  const node = await getProjectNodeForAuthor(author._id, project._id, nodeId);
  if (node._id.equals(project.rootNodeId)) {
    throw APIError.invalidArgument("root node cannot be deleted");
  }

  const nodes =
    node.kind === "folder"
      ? [node, ...(await contentRepo.findProjectNodeChildrenRecursive(project._id, node._id))]
      : [node];

  for (const currentNode of nodes) {
    if (currentNode.kind === "file" && currentNode.storageKey) {
      await deleteObject(currentNode.storageKey);
    }
  }

  await contentRepo.deleteProjectNodes(nodes.map((currentNode) => currentNode._id));
}

export async function downloadMyProjectFile(
  walletAddress: string,
  projectId: string,
  nodeId: string
): Promise<{ body: Buffer; contentType: string; name: string }> {
  const { author, project } = await getMyProjectContext(walletAddress, projectId);
  const node = await getProjectNodeForAuthor(author._id, project._id, nodeId);
  return downloadProjectNodeObject(node);
}

export async function listPublicProjectNodes(
  slug: string,
  projectId: string,
  viewerWallet: string | undefined,
  parentId?: string | null
): Promise<ProjectNodeDoc[]> {
  const project = await contentService.getAuthorProjectBySlugAndId(
    slug,
    projectId,
    viewerWallet
  );
  const parentObjectId = await resolvePublicParentId(project, parentId ?? null);
  return contentRepo.listPublishedProjectNodesByParent(project._id, parentObjectId);
}

export async function downloadPublicProjectFile(
  slug: string,
  projectId: string,
  nodeId: string,
  viewerWallet?: string
): Promise<{ body: Buffer; contentType: string; name: string }> {
  const project = await contentService.getAuthorProjectBySlugAndId(
    slug,
    projectId,
    viewerWallet
  );
  const node = await getPublishedProjectNode(project._id, nodeId);
  return downloadProjectNodeObject(node);
}

async function getMyProjectContext(walletAddress: string, projectId: string) {
  const author = await contentService.getMyAuthorProfile(walletAddress);
  const projectObjectId = parseObjectId(projectId, "projectId");
  const project = await contentRepo.findProjectByIdAndAuthorId(
    projectObjectId,
    author._id
  );
  if (!project) {
    throw APIError.notFound("project not found");
  }

  return { author, project };
}

async function resolveParentId(
  authorId: ObjectId,
  project: ProjectDoc,
  parentId: string | null
): Promise<ObjectId> {
  if (!parentId) {
    return project.rootNodeId;
  }

  const parent = await contentRepo.findProjectNodeByIdAndProjectId(
    parseObjectId(parentId, "parentId"),
    project._id
  );
  if (!parent || !parent.authorId.equals(authorId) || parent.kind !== "folder") {
    throw APIError.invalidArgument("parent folder not found");
  }

  return parent._id;
}

async function resolvePublicParentId(
  project: ProjectDoc,
  parentId: string | null
): Promise<ObjectId> {
  if (!parentId) {
    return project.rootNodeId;
  }

  const parent = await contentRepo.findProjectNodeByIdAndProjectId(
    parseObjectId(parentId, "parentId"),
    project._id
  );
  if (!parent || parent.kind !== "folder" || parent.visibility !== "published") {
    throw APIError.notFound("folder not found");
  }

  return parent._id;
}

async function getProjectNodeForAuthor(
  authorId: ObjectId,
  projectId: ObjectId,
  nodeId: string
): Promise<ProjectNodeDoc> {
  const node = await contentRepo.findProjectNodeByIdAndProjectId(
    parseObjectId(nodeId, "nodeId"),
    projectId
  );
  if (!node || !node.authorId.equals(authorId)) {
    throw APIError.notFound("project node not found");
  }
  return node;
}

async function getPublishedProjectNode(
  projectId: ObjectId,
  nodeId: string
): Promise<ProjectNodeDoc> {
  const node = await contentRepo.findProjectNodeByIdAndProjectId(
    parseObjectId(nodeId, "nodeId"),
    projectId
  );
  if (!node || node.visibility !== "published") {
    throw APIError.notFound("project node not found");
  }
  return node;
}

async function downloadProjectNodeObject(
  node: ProjectNodeDoc
): Promise<{ body: Buffer; contentType: string; name: string }> {
  if (node.kind !== "file" || !node.storageKey) {
    throw APIError.invalidArgument("node is not a file");
  }

  const object = await getObject(node.storageKey);
  return {
    body: object.body,
    contentType: node.mimeType || object.contentType,
    name: node.name,
  };
}

function normalizeNodeName(name: string): string {
  const value = name.trim();
  if (!value) {
    throw APIError.invalidArgument("node name is required");
  }
  if (value.length > 160) {
    throw APIError.invalidArgument("node name is too long");
  }
  if (value.includes("/") || value === "." || value === "..") {
    throw APIError.invalidArgument("node name is invalid");
  }
  return value;
}

function normalizeVisibility(visibility?: "author" | "published") {
  return visibility ?? "author";
}

function normalizeContentType(contentType: string): string {
  return contentType.trim() || "application/octet-stream";
}

function parseObjectId(value: string, field: string): ObjectId {
  if (!ObjectId.isValid(value)) {
    throw APIError.invalidArgument(`${field} is invalid`);
  }
  return new ObjectId(value);
}
