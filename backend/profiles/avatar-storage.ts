import type { ObjectId } from "mongodb";
import { APIError } from "encore.dev/api";
import {
  getObject,
  normalizeObjectContentType,
  putObject,
} from "../storage/object-storage";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

export function createProfileAvatarStorageKey(avatarId: ObjectId): string {
  return ["profiles", "avatars", avatarId.toHexString(), "avatar"].join("/");
}

export function assertAvatarFile(body: Buffer, contentType: string): void {
  if (!body.length) {
    throw APIError.invalidArgument("avatar file is empty");
  }

  if (body.length > MAX_AVATAR_BYTES) {
    throw APIError.invalidArgument("avatar file is too large");
  }

  if (!normalizeObjectContentType(contentType).startsWith("image/")) {
    throw APIError.invalidArgument("avatar must be an image");
  }
}

export async function uploadProfileAvatarFile(
  avatarId: ObjectId,
  body: Buffer,
  contentType: string,
): Promise<void> {
  await putObject(
    createProfileAvatarStorageKey(avatarId),
    body,
    normalizeObjectContentType(contentType),
  );
}

export async function readProfileAvatarFile(
  avatarId: ObjectId,
): Promise<{ body: Buffer; contentType: string; fileName: string }> {
  const object = await getObject(createProfileAvatarStorageKey(avatarId));
  return {
    body: object.body,
    contentType: object.contentType,
    fileName: "avatar",
  };
}
