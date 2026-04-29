import type { AuthorPlatformBillingDto, AuthorPlatformCleanupPreviewDto, AuthorPlatformCleanupRunDto, CreatePlatformSubscriptionPaymentIntentInput, PlatformSubscriptionPaymentIntentDto } from "@shared/types/platform"
import type { ConfirmSubscriptionPaymentInput } from "@shared/types/subscriptions"
import type { ContractDeploymentLookupDto } from "@shared/types/contracts"
import type { ListPlatformPlansResponseDto } from "@shared/types/responses"

import { getData, postData } from "@/utils/api/http"
import { unwrapResponseKey } from "@/utils/api/response"

class PlatformApi {
    async listPlatformPlans() {
        const response = await getData<ListPlatformPlansResponseDto>("/platform/plans")
        return unwrapResponseKey(response, "plans")
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
        return unwrapResponseKey(response, "deployment")
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
