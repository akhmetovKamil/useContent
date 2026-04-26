import type {
    AuthorPlatformBillingDto,
    AuthorPlatformCleanupPreviewDto,
    AuthorPlatformCleanupRunDto,
    ConfirmSubscriptionPaymentInput,
    ContractDeploymentLookupDto,
    CreatePlatformSubscriptionPaymentIntentInput,
    ListPlatformPlansResponseDto,
    PlatformSubscriptionPaymentIntentDto,
} from "@shared/types/content"

import { getData, postData } from "@/utils/api/http"

class PlatformApi {
    async listPlatformPlans() {
        const response = await getData<ListPlatformPlansResponseDto>("/platform/plans")
        return response.plans
    }

    async getMyAuthorPlatformBilling() {
        return getData<AuthorPlatformBillingDto>("/me/author/platform-billing")
    }

    async previewMyAuthorPlatformCleanup() {
        return getData<AuthorPlatformCleanupPreviewDto>(
            "/me/author/platform-cleanup-preview"
        )
    }

    async runMyAuthorPlatformCleanup() {
        return postData<AuthorPlatformCleanupRunDto>("/me/author/platform-cleanup")
    }

    async getPlatformSubscriptionManagerDeployment(chainId: number) {
        const response = await getData<ContractDeploymentLookupDto>(
            `/contract-deployments/platform-subscription-manager/${chainId}`
        )
        return response.deployment
    }

    async createPlatformSubscriptionPaymentIntent(
        input: CreatePlatformSubscriptionPaymentIntentInput
    ) {
        return postData<PlatformSubscriptionPaymentIntentDto>(
            "/me/author/platform-payment-intents",
            input
        )
    }

    async confirmPlatformSubscriptionPayment(
        intentId: string,
        input: ConfirmSubscriptionPaymentInput
    ) {
        return postData<PlatformSubscriptionPaymentIntentDto>(
            `/me/author/platform-payment-intents/${intentId}/confirm`,
            input
        )
    }
}

export const platformApi = new PlatformApi()
