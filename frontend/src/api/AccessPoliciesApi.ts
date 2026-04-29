import type { AccessPolicyPresetDto, CreateAccessPolicyPresetInput, UpdateAccessPolicyPresetInput } from "@shared/types/access"
import type { ListAccessPolicyPresetsResponseDto } from "@shared/types/responses"

import { deleteData, getData, patchData, postData } from "@/utils/api/http"
import { unwrapResponseKey } from "@/utils/api/response"

class AccessPoliciesApi {
    async listMyAccessPolicies() {
        const response = await getData<ListAccessPolicyPresetsResponseDto>("/me/access-policies")
        return unwrapResponseKey(response, "policies")
    }

    async createMyAccessPolicy(input: CreateAccessPolicyPresetInput) {
        return postData<AccessPolicyPresetDto>("/me/access-policies", input)
    }

    async updateMyAccessPolicy(policyId: string, input: UpdateAccessPolicyPresetInput) {
        return patchData<AccessPolicyPresetDto>(`/me/access-policies/${policyId}`, input)
    }

    async deleteMyAccessPolicy(policyId: string) {
        await deleteData(`/me/access-policies/${policyId}`)
    }
}

export const accessPoliciesApi = new AccessPoliciesApi()
