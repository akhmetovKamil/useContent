import type { AuthorPlatformBillingDto, PlatformPlanDto } from "@contracts/types/content"

import { http } from "@/utils/api/http"

class PlatformApi {
    async listPlatformPlans() {
        const response = await http.get<{ plans: PlatformPlanDto[] }>("/platform/plans")
        return response.data.plans
    }

    async getMyAuthorPlatformBilling() {
        const response = await http.get<AuthorPlatformBillingDto>("/me/author/platform-billing")
        return response.data
    }
}

export const platformApi = new PlatformApi()
