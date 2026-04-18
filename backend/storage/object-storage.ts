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
  await userContent.upload(key, body, { contentType });
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

export async function* listObjects(prefix: string): AsyncIterable<{
  name: string;
  size: number;
}> {
  for await (const entry of userContent.list({ prefix })) {
    yield {
      name: entry.name,
      size: entry.size,
    };
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
    "Projects",
    input.projectId,
    "nodes",
    input.nodeId,
    encodeURIComponent(input.fileName),
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
    "Posts",
    input.postId,
    "attachments",
    input.attachmentId,
    encodeURIComponent(input.fileName),
  ].join("/");
}

function isObjectNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as { code?: string; name?: string };
  return candidate.code === "object_not_found" || candidate.name === "ObjectNotFound";
}
