import type {
    CreateAccessPolicyPresetInput,
    UpdateAccessPolicyPresetInput,
} from "@contracts/types/content"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { accessPoliciesApi } from "@/api/AccessPoliciesApi"
import { queryKeys } from "./queryKeys"

export function useMyAccessPoliciesQuery(enabled = true) {
    return useQuery({
        queryKey: queryKeys.myAccessPolicies,
        queryFn: () => accessPoliciesApi.listMyAccessPolicies(),
        enabled,
    })
}

export function useCreateMyAccessPolicyMutation() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (input: CreateAccessPolicyPresetInput) =>
            accessPoliciesApi.createMyAccessPolicy(input),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: queryKeys.myAccessPolicies })
            void queryClient.invalidateQueries({ queryKey: queryKeys.myAuthor })
        },
    })
}

export function useUpdateMyAccessPolicyMutation() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({
            input,
            policyId,
        }: {
            input: UpdateAccessPolicyPresetInput
            policyId: string
        }) => accessPoliciesApi.updateMyAccessPolicy(policyId, input),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: queryKeys.myAccessPolicies })
            void queryClient.invalidateQueries({ queryKey: queryKeys.myAuthor })
        },
    })
}

export function useDeleteMyAccessPolicyMutation() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (policyId: string) => accessPoliciesApi.deleteMyAccessPolicy(policyId),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: queryKeys.myAccessPolicies })
        },
    })
}
