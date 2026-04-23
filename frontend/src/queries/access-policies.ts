import type {
    CreateAccessPolicyPresetInput,
    UpdateAccessPolicyPresetInput,
} from "@shared/types/content"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { accessPoliciesApi } from "@/api/AccessPoliciesApi"
import { invalidateMany } from "@/queries/invalidate"
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
            void invalidateMany(queryClient, [queryKeys.myAccessPolicies, queryKeys.myAuthor])
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
            void invalidateMany(queryClient, [queryKeys.myAccessPolicies, queryKeys.myAuthor])
        },
    })
}

export function useDeleteMyAccessPolicyMutation() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (policyId: string) => accessPoliciesApi.deleteMyAccessPolicy(policyId),
        onSuccess: () => {
            void invalidateMany(queryClient, [queryKeys.myAccessPolicies])
        },
    })
}
