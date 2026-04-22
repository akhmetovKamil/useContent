import { userContent } from "./bucket";

export interface StoredObject {
  body: Buffer;
  contentType: string;
  size: number;
}

export async function putObject(
  key: string,
  body: Buffer,
  contentType: string
): Promise<void> {
  await userContent.upload(key, body, {
    contentType: normalizeObjectContentType(contentType),
  });
}

export async function getObject(key: string): Promise<StoredObject> {
  const attrs = await userContent.attrs(key);
  const body = await userContent.download(key);

  return {
    body,
    contentType: attrs.contentType || "application/octet-stream",
    size: body.length,
  };
}

export async function deleteObject(key: string): Promise<void> {
  try {
    await userContent.remove(key);
  } catch (error) {
    if (!isObjectNotFoundError(error)) {
      throw error;
    }
  }
}

export function createProjectObjectKey(input: {
  authorId: string;
  projectId: string;
  nodeId: string;
  fileName: string;
}): string {
  return [
    "authors",
    input.authorId,
    "projects",
    input.projectId,
    "nodes",
    input.nodeId,
    encodeStorageFileName(input.fileName),
  ].join("/");
}

export function createPostAttachmentObjectKey(input: {
  authorId: string;
  postId: string;
  attachmentId: string;
  fileName: string;
}): string {
  return [
    "authors",
    input.authorId,
    "posts",
    input.postId,
    "attachments",
    input.attachmentId,
    encodeStorageFileName(input.fileName),
  ].join("/");
}

export function normalizeObjectContentType(contentType: string | null | undefined): string {
  return contentType?.trim() || "application/octet-stream";
}

function encodeStorageFileName(fileName: string): string {
  const normalizedName = fileName.trim() || "file";
  return encodeURIComponent(normalizedName);
}

function isObjectNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as { code?: string; name?: string };
  return candidate.code === "object_not_found" || candidate.name === "ObjectNotFound";
}
