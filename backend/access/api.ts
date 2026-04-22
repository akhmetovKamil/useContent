import { api, type Header } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { getOptionalViewerWallet } from "../lib/api-helpers";
import * as service from "./service";
import type {
  AccessPolicyPresetResponse,
  AuthorAccessPolicyResponse,
  CreateAccessPolicyPresetRequest,
  UpdateAccessPolicyPresetRequest,
} from "./types";

export const listMyAccessPolicyPresets = api(
  { method: "GET", path: "/me/access-policies", expose: true, auth: true },
  async (): Promise<{ policies: AccessPolicyPresetResponse[] }> => {
    const auth = getAuthData()!;
    const policies = await service.listMyAccessPolicyPresetResponses(
      auth.walletAddress,
    );
    return { policies };
  },
);

export const createMyAccessPolicyPreset = api(
  { method: "POST", path: "/me/access-policies", expose: true, auth: true },
  async (
    req: CreateAccessPolicyPresetRequest,
  ): Promise<AccessPolicyPresetResponse> => {
    const auth = getAuthData()!;
    const policy = await service.createMyAccessPolicyPreset(
      auth.walletAddress,
      req,
    );
    return service.toAccessPolicyPresetResponse(policy);
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
  }: UpdateAccessPolicyPresetRequest & {
    policyId: string;
  }): Promise<AccessPolicyPresetResponse> => {
    const auth = getAuthData()!;
    const policy = await service.updateMyAccessPolicyPreset(
      auth.walletAddress,
      policyId,
      req,
    );
    return service.toAccessPolicyPresetResponse(policy);
  },
);

export const deleteMyAccessPolicyPreset = api(
  {
    method: "DELETE",
    path: "/me/access-policies/:policyId",
    expose: true,
    auth: true,
  },
  async ({ policyId }: { policyId: string }): Promise<void> => {
    const auth = getAuthData()!;
    await service.deleteMyAccessPolicyPreset(auth.walletAddress, policyId);
  },
);

interface ListAuthorAccessPoliciesRequest {
  slug: string;
  authorization?: Header<"Authorization">;
}

export const listAuthorAccessPolicies = api(
  { method: "GET", path: "/authors/:slug/access-policies", expose: true },
  async ({
    slug,
    authorization,
  }: ListAuthorAccessPoliciesRequest): Promise<{
    policies: AuthorAccessPolicyResponse[];
  }> => {
    const viewerWallet = await getOptionalViewerWallet(authorization);
    const policies = await service.listAuthorAccessPoliciesBySlug(
      slug,
      viewerWallet,
    );
    return { policies };
  },
);
