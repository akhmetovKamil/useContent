import { ObjectId } from "mongodb";
import { userContent } from "../storage/bucket";
import * as repo from "./repository";
import type { FileDoc, FileResponse } from "./types";

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
  await userContent.upload(storageKey, body, { contentType });

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

  const body = await userContent.download(doc.storageKey);

  return {
    body,
    contentType: doc.mimeType || "application/octet-stream",
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
        await userContent.remove(child.storageKey);
      }
      await repo.deleteById(child._id.toHexString());
    }
  } else if (doc.storageKey) {
    await userContent.remove(doc.storageKey);
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
