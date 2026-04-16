import type {
    ConfirmSubscriptionPaymentInput,
    ContractDeploymentDto,
    CreateSubscriptionPaymentIntentInput,
    SubscriptionPaymentIntentDto,
    SubscriptionPlanDto,
    UpsertSubscriptionPlanInput,
} from "@contracts/types/content"

import { http } from "@/utils/api/http"

class SubscriptionPlansApi {
    async getSubscriptionManagerDeployment(chainId: number) {
        const response = await http.get<ContractDeploymentDto | null>(
            `/contract-deployments/subscription-manager/${chainId}`
        )
        return response.data
    }

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

    async deleteMySubscriptionPlan(planId: string) {
        await http.delete(`/me/subscription-plans/${planId}`)
    }

    async createSubscriptionPaymentIntent(
        slug: string,
        input: CreateSubscriptionPaymentIntentInput
    ) {
        const response = await http.post<SubscriptionPaymentIntentDto>(
            `/authors/${slug}/subscription-payment-intents`,
            input
        )
        return response.data
    }

    async confirmSubscriptionPayment(intentId: string, input: ConfirmSubscriptionPaymentInput) {
        const response = await http.post<SubscriptionPaymentIntentDto>(
            `/me/subscription-payment-intents/${intentId}/confirm`,
            input
        )
        return response.data
    }
}

export const subscriptionPlansApi = new SubscriptionPlansApi()
