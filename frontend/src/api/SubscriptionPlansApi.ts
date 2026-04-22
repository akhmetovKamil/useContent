import type {
    ConfirmSubscriptionPaymentInput,
    ContractDeploymentLookupDto,
    CreateSubscriptionPaymentIntentInput,
    SubscriptionPaymentIntentDto,
    SubscriptionPlanDto,
    UpsertSubscriptionPlanInput,
} from "@contracts/types/content"

import { http } from "@/utils/api/http"

class SubscriptionPlansApi {
    async getSubscriptionManagerDeployment(chainId: number) {
        const response = await http.get<ContractDeploymentLookupDto>(
            `/contract-deployments/subscription-manager/${chainId}`
        )
        return response.data.deployment
    }

    async listMySubscriptionPlans() {
        const response = await http.get<{ plans: SubscriptionPlanDto[] }>("/me/subscription-plans")
        return response.data.plans
    }

    async upsertMySubscriptionPlan(input: UpsertSubscriptionPlanInput) {
        const response = await http.put<SubscriptionPlanDto>("/me/subscription-plans", input)
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
