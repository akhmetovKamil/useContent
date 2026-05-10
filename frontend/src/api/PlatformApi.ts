import type { AuthorPlatformBillingDto, AuthorPlatformCleanupPreviewDto, AuthorPlatformCleanupRunDto, CreatePlatformStoragePaymentIntentInput, CreatePlatformTierPaymentIntentInput, PlatformStoragePaymentIntentDto, PlatformTierPaymentIntentDto } from "@shared/types/platform"
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

    async getPlatformTierManagerDeployment(chainId: number) {
        const response = await getData<ContractDeploymentLookupDto>(
            `/contract-deployments/platform-tier-manager/${chainId}`
        )
        return unwrapResponseKey(response, "deployment")
    }

    async getPlatformStorageManagerDeployment(chainId: number) {
        const response = await getData<ContractDeploymentLookupDto>(
            `/contract-deployments/platform-storage-manager/${chainId}`
        )
        return unwrapResponseKey(response, "deployment")
    }

    async createPlatformTierPaymentIntent(
        input: CreatePlatformTierPaymentIntentInput
    ) {
        return postData<PlatformTierPaymentIntentDto>(
            "/me/author/platform-tier-payment-intents",
            input
        )
    }

    async confirmPlatformTierPayment(
        intentId: string,
        input: ConfirmSubscriptionPaymentInput
    ) {
        return postData<PlatformTierPaymentIntentDto>(
            `/me/author/platform-tier-payment-intents/${intentId}/confirm`,
            input
        )
    }

    async createPlatformStoragePaymentIntent(
        input: CreatePlatformStoragePaymentIntentInput
    ) {
        return postData<PlatformStoragePaymentIntentDto>(
            "/me/author/platform-storage-payment-intents",
            input
        )
    }

    async confirmPlatformStoragePayment(
        intentId: string,
        input: ConfirmSubscriptionPaymentInput
    ) {
        return postData<PlatformStoragePaymentIntentDto>(
            `/me/author/platform-storage-payment-intents/${intentId}/confirm`,
            input
        )
    }
}

export const platformApi = new PlatformApi()
