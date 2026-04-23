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

export function normalizeObjectContentType(contentType: string | null | undefined): string {
  return contentType?.trim() || "application/octet-stream";
}

function isObjectNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as { code?: string; name?: string };
  return candidate.code === "object_not_found" || candidate.name === "ObjectNotFound";
}
