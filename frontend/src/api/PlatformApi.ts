import type {
    AuthorPlatformBillingDto,
    AuthorPlatformCleanupPreviewDto,
    AuthorPlatformCleanupRunDto,
    ConfirmSubscriptionPaymentInput,
    ContractDeploymentLookupDto,
    CreatePlatformSubscriptionPaymentIntentInput,
    PlatformPlanDto,
    PlatformSubscriptionPaymentIntentDto,
} from "@shared/types/content"

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

    async previewMyAuthorPlatformCleanup() {
        const response = await http.get<AuthorPlatformCleanupPreviewDto>(
            "/me/author/platform-cleanup-preview"
        )
        return response.data
    }

    async runMyAuthorPlatformCleanup() {
        const response = await http.post<AuthorPlatformCleanupRunDto>("/me/author/platform-cleanup")
        return response.data
    }

    async getPlatformSubscriptionManagerDeployment(chainId: number) {
        const response = await http.get<ContractDeploymentLookupDto>(
            `/contract-deployments/platform-subscription-manager/${chainId}`
        )
        return response.data.deployment
    }

    async createPlatformSubscriptionPaymentIntent(
        input: CreatePlatformSubscriptionPaymentIntentInput
    ) {
        const response = await http.post<PlatformSubscriptionPaymentIntentDto>(
            "/me/author/platform-payment-intents",
            input
        )
        return response.data
    }

    async confirmPlatformSubscriptionPayment(
        intentId: string,
        input: ConfirmSubscriptionPaymentInput
    ) {
        const response = await http.post<PlatformSubscriptionPaymentIntentDto>(
            `/me/author/platform-payment-intents/${intentId}/confirm`,
            input
        )
        return response.data
    }
}

export const platformApi = new PlatformApi()
