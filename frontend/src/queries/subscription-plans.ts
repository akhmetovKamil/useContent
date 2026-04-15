import type { UpsertSubscriptionPlanInput } from "@contracts/types/content"
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

export function useAuthorSubscriptionPlanQuery(slug: string) {
    return useQuery({
        queryKey: queryKeys.authorSubscriptionPlan(slug),
        queryFn: () => authorsApi.getAuthorSubscriptionPlan(slug),
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
            void queryClient.invalidateQueries({ queryKey: ["authors"] })
        },
    })
}
