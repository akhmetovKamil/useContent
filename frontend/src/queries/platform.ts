import type { ConfirmSubscriptionPaymentInput } from "@shared/types/subscriptions"
import type { CreatePlatformSubscriptionPaymentIntentInput } from "@shared/types/platform"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { platformApi } from "@/api/PlatformApi"
import { invalidateMany } from "@/queries/invalidate"
import { queryKeys } from "./queryKeys"

export function usePlatformPlansQuery() {
    return useQuery({
        queryKey: queryKeys.platformPlans,
        queryFn: () => platformApi.listPlatformPlans(),
    })
}

export function useMyAuthorPlatformBillingQuery(enabled = true) {
    return useQuery({
        queryKey: queryKeys.myAuthorPlatformBilling,
        queryFn: () => platformApi.getMyAuthorPlatformBilling(),
        enabled,
    })
}

export function useMyAuthorPlatformCleanupPreviewQuery(enabled = true) {
    return useQuery({
        queryKey: queryKeys.myAuthorPlatformCleanupPreview,
        queryFn: () => platformApi.previewMyAuthorPlatformCleanup(),
        enabled,
    })
}

export function usePlatformSubscriptionManagerDeploymentQuery(chainId: number) {
    return useQuery({
        queryKey: queryKeys.platformSubscriptionManagerDeployment(chainId),
        queryFn: () => platformApi.getPlatformSubscriptionManagerDeployment(chainId),
        enabled: Number.isInteger(chainId) && chainId > 0,
    })
}

export function useCreatePlatformSubscriptionPaymentIntentMutation() {
    return useMutation({
        mutationFn: (input: CreatePlatformSubscriptionPaymentIntentInput) =>
            platformApi.createPlatformSubscriptionPaymentIntent(input),
    })
}

export function useConfirmPlatformSubscriptionPaymentMutation() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({
            input,
            intentId,
        }: {
            input: ConfirmSubscriptionPaymentInput
            intentId: string
        }) => platformApi.confirmPlatformSubscriptionPayment(intentId, input),
        onSuccess: () => {
            void invalidateMany(queryClient, [
                queryKeys.myAuthorPlatformBilling,
                queryKeys.myProjects(),
                queryKeys.platformPlans,
            ])
        },
    })
}

export function useRunMyAuthorPlatformCleanupMutation() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: () => platformApi.runMyAuthorPlatformCleanup(),
        onSuccess: () => {
            void invalidateMany(queryClient, [
                queryKeys.myAuthorPlatformBilling,
                queryKeys.myAuthorPlatformCleanupPreview,
                queryKeys.myProjects(),
            ])
        },
    })
}
