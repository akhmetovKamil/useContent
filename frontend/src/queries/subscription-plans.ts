import type { ConfirmSubscriptionPaymentInput, CreateSubscriptionPaymentIntentInput, UpsertSubscriptionPlanInput } from "@shared/types/subscriptions"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { authorsApi } from "@/api/AuthorsApi"
import { invalidateMany } from "@/queries/invalidate"
import { subscriptionPlansApi } from "@/api/SubscriptionPlansApi"
import { queryKeys } from "./queryKeys"

export function useMySubscriptionPlansQuery(enabled = true) {
    return useQuery({
        queryKey: queryKeys.mySubscriptionPlans,
        queryFn: () => subscriptionPlansApi.listMySubscriptionPlans(),
        enabled,
    })
}

export function useSubscriptionManagerDeploymentQuery(chainId: number) {
    return useQuery({
        queryKey: queryKeys.subscriptionManagerDeployment(chainId),
        queryFn: () => subscriptionPlansApi.getSubscriptionManagerDeployment(chainId),
        enabled: Number.isInteger(chainId) && chainId > 0,
    })
}

export function useAuthorSubscriptionPlansQuery(slug: string) {
    return useQuery({
        queryKey: queryKeys.authorSubscriptionPlans(slug),
        queryFn: () => authorsApi.listAuthorSubscriptionPlans(slug),
        enabled: Boolean(slug),
    })
}

export function useUpsertMySubscriptionPlanMutation() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (input: UpsertSubscriptionPlanInput) =>
            subscriptionPlansApi.upsertMySubscriptionPlan(input),
        onSuccess: () => {
            void invalidateMany(queryClient, [
                queryKeys.mySubscriptionPlans,
                queryKeys.authors(),
            ])
        },
    })
}

export function useDeleteMySubscriptionPlanMutation() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (planId: string) => subscriptionPlansApi.deleteMySubscriptionPlan(planId),
        onSuccess: () => {
            void invalidateMany(queryClient, [
                queryKeys.mySubscriptionPlans,
                queryKeys.authors(),
            ])
        },
    })
}

export function useCreateSubscriptionPaymentIntentMutation(slug: string) {
    return useMutation({
        mutationFn: (input: CreateSubscriptionPaymentIntentInput) =>
            subscriptionPlansApi.createSubscriptionPaymentIntent(slug, input),
    })
}

export function useConfirmSubscriptionPaymentMutation() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({
            intentId,
            input,
        }: {
            intentId: string
            input: ConfirmSubscriptionPaymentInput
        }) => subscriptionPlansApi.confirmSubscriptionPayment(intentId, input),
        onSuccess: () => {
            void invalidateMany(queryClient, [
                queryKeys.myEntitlements,
                queryKeys.myReaderSubscriptions,
                queryKeys.myFeedPosts,
                queryKeys.authors(),
            ])
        },
    })
}
