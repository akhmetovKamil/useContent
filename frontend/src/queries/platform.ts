import type { ConfirmSubscriptionPaymentInput } from "@shared/types/subscriptions"
import type { CreatePlatformStoragePaymentIntentInput, CreatePlatformTierPaymentIntentInput } from "@shared/types/platform"
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

export function usePlatformTierManagerDeploymentQuery(chainId: number) {
    return useQuery({
        queryKey: queryKeys.platformTierManagerDeployment(chainId),
        queryFn: () => platformApi.getPlatformTierManagerDeployment(chainId),
        enabled: Number.isInteger(chainId) && chainId > 0,
    })
}

export function usePlatformStorageManagerDeploymentQuery(chainId: number) {
    return useQuery({
        queryKey: queryKeys.platformStorageManagerDeployment(chainId),
        queryFn: () => platformApi.getPlatformStorageManagerDeployment(chainId),
        enabled: Number.isInteger(chainId) && chainId > 0,
    })
}

export function useCreatePlatformTierPaymentIntentMutation() {
    return useMutation({
        mutationFn: (input: CreatePlatformTierPaymentIntentInput) =>
            platformApi.createPlatformTierPaymentIntent(input),
    })
}

export function useConfirmPlatformTierPaymentMutation() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({
            input,
            intentId,
        }: {
            input: ConfirmSubscriptionPaymentInput
            intentId: string
        }) => platformApi.confirmPlatformTierPayment(intentId, input),
        onSuccess: () => {
            void invalidateMany(queryClient, [
                queryKeys.myAuthorPlatformBilling,
                queryKeys.myProjects(),
                queryKeys.platformPlans,
            ])
        },
    })
}

export function useCreatePlatformStoragePaymentIntentMutation() {
    return useMutation({
        mutationFn: (input: CreatePlatformStoragePaymentIntentInput) =>
            platformApi.createPlatformStoragePaymentIntent(input),
    })
}

export function useConfirmPlatformStoragePaymentMutation() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({
            input,
            intentId,
        }: {
            input: ConfirmSubscriptionPaymentInput
            intentId: string
        }) => platformApi.confirmPlatformStoragePayment(intentId, input),
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
