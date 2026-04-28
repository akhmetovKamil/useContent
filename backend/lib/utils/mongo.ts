import { APIError } from "encore.dev/api";
import { ObjectId } from "mongodb";

export function isMongoDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === 11000
  );
}

export function parseObjectId(value: string, field: string): ObjectId {
  if (!ObjectId.isValid(value)) {
    throw APIError.invalidArgument(`${field} is invalid`);
  }

  return new ObjectId(value);
}

export function uniqueObjectIds(ids: ObjectId[]): ObjectId[] {
  const seen = new Set<string>();
  const result: ObjectId[] = [];
  for (const id of ids) {
    const key = id.toHexString();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(id);
  }

  return result;
}
