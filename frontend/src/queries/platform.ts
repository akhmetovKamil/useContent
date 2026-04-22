import type {
    ConfirmSubscriptionPaymentInput,
    CreatePlatformSubscriptionPaymentIntentInput,
} from "@contracts/types/content"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { platformApi } from "@/api/PlatformApi"
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
            void queryClient.invalidateQueries({ queryKey: queryKeys.myAuthorPlatformBilling })
            void queryClient.invalidateQueries({ queryKey: queryKeys.myProjects() })
            void queryClient.invalidateQueries({ queryKey: queryKeys.platformPlans })
        },
    })
}

export function useRunMyAuthorPlatformCleanupMutation() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: () => platformApi.runMyAuthorPlatformCleanup(),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: queryKeys.myAuthorPlatformBilling })
            void queryClient.invalidateQueries({
                queryKey: queryKeys.myAuthorPlatformCleanupPreview,
            })
            void queryClient.invalidateQueries({ queryKey: queryKeys.myProjects() })
        },
    })
}
