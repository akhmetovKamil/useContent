import type {
    ConfirmSubscriptionPaymentInput,
    CreateSubscriptionPaymentIntentInput,
    UpsertSubscriptionPlanInput,
} from "@contracts/types/content"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { authorsApi } from "@/api/AuthorsApi"
import { subscriptionPlansApi } from "@/api/SubscriptionPlansApi"
import { queryKeys } from "./queryKeys"

export function useMySubscriptionPlanQuery(enabled = true) {
    return useQuery({
        queryKey: queryKeys.mySubscriptionPlan,
        queryFn: () => subscriptionPlansApi.getMySubscriptionPlan(),
        enabled,
    })
}

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

export function useAuthorSubscriptionPlanQuery(slug: string) {
    return useQuery({
        queryKey: queryKeys.authorSubscriptionPlan(slug),
        queryFn: () => authorsApi.getAuthorSubscriptionPlan(slug),
        enabled: Boolean(slug),
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
            void queryClient.invalidateQueries({ queryKey: queryKeys.mySubscriptionPlan })
            void queryClient.invalidateQueries({ queryKey: queryKeys.mySubscriptionPlans })
            void queryClient.invalidateQueries({ queryKey: ["authors"] })
        },
    })
}

export function useDeleteMySubscriptionPlanMutation() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (planId: string) => subscriptionPlansApi.deleteMySubscriptionPlan(planId),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: queryKeys.mySubscriptionPlan })
            void queryClient.invalidateQueries({ queryKey: queryKeys.mySubscriptionPlans })
            void queryClient.invalidateQueries({ queryKey: ["authors"] })
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
            void queryClient.invalidateQueries({ queryKey: queryKeys.myEntitlements })
            void queryClient.invalidateQueries({ queryKey: ["authors"] })
        },
    })
}
