import type {
    AccessPolicyPresetDto,
    CreateAccessPolicyPresetInput,
    UpdateAccessPolicyPresetInput,
} from "@shared/types/content"

import { http } from "@/utils/api/http"

class AccessPoliciesApi {
    async listMyAccessPolicies() {
        const response = await http.get<{ policies: AccessPolicyPresetDto[] }>(
            "/me/access-policies"
        )
        return response.data.policies
    }

    async createMyAccessPolicy(input: CreateAccessPolicyPresetInput) {
        const response = await http.post<AccessPolicyPresetDto>("/me/access-policies", input)
        return response.data
    }

    async updateMyAccessPolicy(policyId: string, input: UpdateAccessPolicyPresetInput) {
        const response = await http.patch<AccessPolicyPresetDto>(
            `/me/access-policies/${policyId}`,
            input
        )
        return response.data
    }

    async deleteMyAccessPolicy(policyId: string) {
        await http.delete(`/me/access-policies/${policyId}`)
    }
}

export const accessPoliciesApi = new AccessPoliciesApi()
