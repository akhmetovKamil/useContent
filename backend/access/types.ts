import type { Header } from "encore.dev/api";
import type { UpdateAccessPolicyPresetRequest } from "../lib/content-types";

export type {
  AccessPolicyPresetResponse,
  CreateAccessPolicyPresetRequest,
} from "../lib/content-types";

export interface DeleteAccessPolicyPresetRequest {
  policyId: string;
}

export interface ListAuthorAccessPoliciesRequest {
  slug: string;
  authorization?: Header<"Authorization">;
}

export type UpdateAccessPolicyPresetPathRequest =
  UpdateAccessPolicyPresetRequest & DeleteAccessPolicyPresetRequest;
