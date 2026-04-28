import type { ProjectNodeDoc } from "./doc-types";
import {
  deleteObject,
  getObject,
  normalizeObjectContentType,
  putObject,
} from "../storage/object-storage";

export function createProjectFileStorageKey(input: {
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
    encodeURIComponent(input.fileName.trim() || "file"),
  ].join("/");
}

export async function uploadProjectFile(
  storageKey: string,
  body: Buffer,
  contentType: string,
): Promise<void> {
  await putObject(storageKey, body, normalizeObjectContentType(contentType));
}

export async function readProjectFile(
  node: ProjectNodeDoc,
): Promise<{ body: Buffer; contentType: string; fileName: string }> {
  if (node.kind !== "file" || !node.storageKey) {
    throw new Error("project node is not a file");
  }

  const object = await getObject(node.storageKey);
  return {
    body: object.body,
    contentType: object.contentType,
    fileName: node.name,
  };
}

export async function deleteProjectFile(storageKey: string): Promise<void> {
  await deleteObject(storageKey);
}
