import type { SubscriptionPlanDto, UpsertSubscriptionPlanInput } from "@contracts/types/content"

import { http } from "@/lib/api/http"

class SubscriptionPlansApi {
    async getMySubscriptionPlan() {
        const response = await http.get<SubscriptionPlanDto>("/me/subscription-plan")
        return response.data
    }

    async upsertMySubscriptionPlan(input: UpsertSubscriptionPlanInput) {
        const response = await http.put<SubscriptionPlanDto>("/me/subscription-plan", input)
        return response.data
    }
}

export const subscriptionPlansApi = new SubscriptionPlansApi()
