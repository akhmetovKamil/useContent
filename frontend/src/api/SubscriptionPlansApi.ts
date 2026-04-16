import type { SubscriptionPlanDto, UpsertSubscriptionPlanInput } from "@contracts/types/content"

import { http } from "@/lib/api/http"

class SubscriptionPlansApi {
    async listMySubscriptionPlans() {
        const response = await http.get<{ plans: SubscriptionPlanDto[] }>("/me/subscription-plans")
        return response.data.plans
    }

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
