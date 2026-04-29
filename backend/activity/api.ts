import { api } from "encore.dev/api";
import { getRequiredWallet } from "../lib/api-helpers";
import type { ActivityDto } from "../../shared/types/posts"
import type { PaginatedResponse } from "../../shared/types/common";
import type { ActivityPaginationRequest } from "./types";
import * as service from "./service";

export const listMyActivity = api(
  { method: "GET", path: "/me/activity", expose: true, auth: true },
  async ({
    cursor,
    limit,
  }: ActivityPaginationRequest): Promise<PaginatedResponse<ActivityDto>> => {
    const walletAddress = getRequiredWallet();
    return service.listMyActivity(walletAddress, { cursor, limit });
  },
);
