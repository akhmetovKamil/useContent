import type { PostAttachmentDoc } from "../lib/content-types";
import {
  deleteObject,
  getObject,
  normalizeObjectContentType,
  putObject,
} from "../storage/object-storage";

export function createPostAttachmentStorageKey(input: {
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
    encodeURIComponent(input.fileName.trim() || "file"),
  ].join("/");
}

export async function uploadPostAttachmentFile(
  storageKey: string,
  body: Buffer,
  contentType: string,
): Promise<void> {
  await putObject(storageKey, body, normalizeObjectContentType(contentType));
}

export async function readPostAttachmentFile(
  attachment: PostAttachmentDoc,
): Promise<{ body: Buffer; contentType: string; fileName: string }> {
  const object = await getObject(attachment.storageKey);
  return {
    body: object.body,
    contentType: object.contentType,
    fileName: attachment.fileName,
  };
}

export async function deletePostAttachmentFile(
  storageKey: string,
): Promise<void> {
  await deleteObject(storageKey);
}
