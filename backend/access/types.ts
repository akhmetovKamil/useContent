import type { Header } from "encore.dev/api";
import type { UpdateAccessPolicyPresetRequest } from "../lib/content-types";

export * from "../lib/content-types";

export interface DeleteAccessPolicyPresetRequest {
  policyId: string;
}

export interface ListAuthorAccessPoliciesRequest {
  slug: string;
  authorization?: Header<"Authorization">;
}

export type UpdateAccessPolicyPresetPathRequest =
  UpdateAccessPolicyPresetRequest & DeleteAccessPolicyPresetRequest;
