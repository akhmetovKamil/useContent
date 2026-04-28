import { APIError } from "encore.dev/api";
import { ObjectId } from "mongodb";
import type { PaginatedResponse } from "../../shared/types/common";
import type { ActivityDoc } from "./doc-types";
import type { ActivityResponse } from "../lib/content-types";
import { normalizeWallet } from "../lib/content-common";
import * as repo from "./repository";

interface ActivityPaginationRequest {
  cursor?: string | null;
  limit?: number;
}

export async function listMyActivity(
  walletAddress: string,
  pagination: ActivityPaginationRequest = {},
): Promise<PaginatedResponse<ActivityResponse>> {
  const page = normalizeActivityPagination(pagination);
  const activities = await repo.listActivitiesByWalletPage({
    targetWallet: normalizeWallet(walletAddress),
    cursor: page.cursor,
    limit: page.limit + 1,
  });

  return toPaginatedActivityResponse(activities, page.limit);
}

function toActivityResponse(activity: ActivityDoc): ActivityResponse {
  return {
    id: activity._id.toHexString(),
    type: activity.type,
    targetWallet: activity.targetWallet,
    actorWallet: activity.actorWallet,
    authorId: activity.authorId?.toHexString() ?? null,
    authorSlug: activity.authorSlug,
    authorDisplayName: activity.authorDisplayName,
    postId: activity.postId?.toHexString() ?? null,
    postTitle: activity.postTitle,
    message: activity.message,
    createdAt: activity.createdAt.toISOString(),
    readAt: activity.readAt?.toISOString() ?? null,
  };
}

function normalizeActivityPagination(input: ActivityPaginationRequest) {
  const limit = Math.max(1, Math.min(input.limit ?? 20, 50));
  return {
    cursor: input.cursor ? decodeActivityCursor(input.cursor) : null,
    limit,
  };
}

function toPaginatedActivityResponse(
  activities: ActivityDoc[],
  requestedLimit: number,
): PaginatedResponse<ActivityResponse> {
  const hasMore = activities.length > requestedLimit;
  const items = (hasMore ? activities.slice(0, requestedLimit) : activities).map(
    toActivityResponse,
  );
  const last = items.at(-1);
  return {
    items,
    hasMore,
    nextCursor: hasMore && last ? encodeActivityCursor(last.createdAt, last.id) : null,
  };
}

function encodeActivityCursor(createdAt: string, id: string): string {
  return Buffer.from(JSON.stringify({ createdAt, id }), "utf8").toString("base64url");
}

function decodeActivityCursor(cursor: string): repo.ActivityCursor {
  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as {
      createdAt?: string;
      id?: string;
    };
    if (!parsed.createdAt || !parsed.id) {
      throw new Error("invalid cursor");
    }
    return {
      createdAt: new Date(parsed.createdAt),
      id: new ObjectId(parsed.id),
    };
  } catch {
    throw APIError.invalidArgument("activity cursor is invalid");
  }
}
