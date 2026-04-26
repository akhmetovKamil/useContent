import type {
    ConfirmSubscriptionPaymentInput,
    ContractDeploymentLookupDto,
    CreateSubscriptionPaymentIntentInput,
    ListSubscriptionPlansResponseDto,
    SubscriptionPaymentIntentDto,
    SubscriptionPlanDto,
    UpsertSubscriptionPlanInput,
} from "@shared/types/content"

import { deleteData, getData, postData, putData } from "@/utils/api/http"

class SubscriptionPlansApi {
    async getSubscriptionManagerDeployment(chainId: number) {
        const response = await getData<ContractDeploymentLookupDto>(
            `/contract-deployments/subscription-manager/${chainId}`
        )
        return response.deployment
    }

    async listMySubscriptionPlans() {
        const response = await getData<ListSubscriptionPlansResponseDto>("/me/subscription-plans")
        return response.plans
    }

    async upsertMySubscriptionPlan(input: UpsertSubscriptionPlanInput) {
        return putData<SubscriptionPlanDto>("/me/subscription-plans", input)
    }

    async deleteMySubscriptionPlan(planId: string) {
        await deleteData(`/me/subscription-plans/${planId}`)
    }

    async createSubscriptionPaymentIntent(
        slug: string,
        input: CreateSubscriptionPaymentIntentInput
    ) {
        return postData<SubscriptionPaymentIntentDto>(
            `/authors/${slug}/subscription-payment-intents`,
            input
        )
    }

    async confirmSubscriptionPayment(intentId: string, input: ConfirmSubscriptionPaymentInput) {
        return postData<SubscriptionPaymentIntentDto>(
            `/me/subscription-payment-intents/${intentId}/confirm`,
            input
        )
    }
}

export const subscriptionPlansApi = new SubscriptionPlansApi()
