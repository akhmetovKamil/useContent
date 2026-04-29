import { api } from "encore.dev/api";
import { getOptionalViewerWallet, getRequiredWallet } from "../lib/api-helpers";
import { toAccessPolicyPresetResponse } from "../lib/content-common";
import * as service from "./service";
import type {
  AccessPolicyPresetResponse,
  CreateAccessPolicyPresetRequest,
  DeleteAccessPolicyPresetRequest,
  ListAuthorAccessPoliciesRequest,
  UpdateAccessPolicyPresetPathRequest,
} from "./types";
import type { ListAccessPolicyPresetsResponseDto, ListAuthorAccessPoliciesResponseDto } from "../../shared/types/responses"

export const listMyAccessPolicyPresets = api(
  { method: "GET", path: "/me/access-policies", expose: true, auth: true },
  async (): Promise<ListAccessPolicyPresetsResponseDto> => {
    const walletAddress = getRequiredWallet();
    const policies =
      await service.listMyAccessPolicyPresetResponses(walletAddress);
    return { policies };
  },
);

export const createMyAccessPolicyPreset = api(
  { method: "POST", path: "/me/access-policies", expose: true, auth: true },
  async (
    req: CreateAccessPolicyPresetRequest,
  ): Promise<AccessPolicyPresetResponse> => {
    const walletAddress = getRequiredWallet();
    const policy = await service.createMyAccessPolicyPreset(walletAddress, req);
    return toAccessPolicyPresetResponse(policy);
  },
);

export const updateMyAccessPolicyPreset = api(
  {
    method: "PATCH",
    path: "/me/access-policies/:policyId",
    expose: true,
    auth: true,
  },
  async ({
    policyId,
    ...req
  }: UpdateAccessPolicyPresetPathRequest): Promise<AccessPolicyPresetResponse> => {
    const walletAddress = getRequiredWallet();
    const policy = await service.updateMyAccessPolicyPreset(
      walletAddress,
      policyId,
      req,
    );
    return toAccessPolicyPresetResponse(policy);
  },
);

export const deleteMyAccessPolicyPreset = api(
  {
    method: "DELETE",
    path: "/me/access-policies/:policyId",
    expose: true,
    auth: true,
  },
  async ({ policyId }: DeleteAccessPolicyPresetRequest): Promise<void> => {
    const walletAddress = getRequiredWallet();
    await service.deleteMyAccessPolicyPreset(walletAddress, policyId);
  },
);

export const listAuthorAccessPolicies = api(
  { method: "GET", path: "/authors/:slug/access-policies", expose: true },
  async ({
    slug,
    authorization,
  }: ListAuthorAccessPoliciesRequest): Promise<ListAuthorAccessPoliciesResponseDto> => {
    const viewerWallet = await getOptionalViewerWallet(authorization);
    const policies = await service.listAuthorAccessPoliciesBySlug(
      slug,
      viewerWallet,
    );
    return { policies };
  },
);
