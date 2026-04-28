import { api } from "encore.dev/api";
import { getRequiredWallet } from "../lib/api-helpers";
import type { CursorPaginationInput, ActivityDto } from "../../shared/types/content";
import type { PaginatedResponse } from "../../shared/types/common";
import * as service from "./service";

export const listMyActivity = api(
  { method: "GET", path: "/me/activity", expose: true, auth: true },
  async ({
    cursor,
    limit,
  }: CursorPaginationInput): Promise<PaginatedResponse<ActivityDto>> => {
    const walletAddress = getRequiredWallet();
    return service.listMyActivity(walletAddress, { cursor, limit });
  },
);
