import type {
    CreateAuthorProfileInput,
    UpdateAuthorProfileInput,
    UpdateMyProfileInput,
} from "@contracts/types/content"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { profileApi } from "@/api/ProfileApi"
import { queryKeys } from "./queryKeys"

export function useMeQuery(enabled = true) {
    return useQuery({
        queryKey: queryKeys.me,
        queryFn: () => profileApi.getMe(),
        enabled,
    })
}

export function useMyAuthorProfileQuery(enabled = true) {
    return useQuery({
        queryKey: queryKeys.myAuthor,
        queryFn: () => profileApi.getMyAuthorProfile(),
        enabled,
    })
}

export function useMyEntitlementsQuery(enabled = true) {
    return useQuery({
        queryKey: queryKeys.myEntitlements,
        queryFn: () => profileApi.getMyEntitlements(),
        enabled,
    })
}

export function useCreateMyAuthorProfileMutation() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (input: CreateAuthorProfileInput) => profileApi.createMyAuthorProfile(input),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: queryKeys.myAuthor })
            void queryClient.invalidateQueries({ queryKey: queryKeys.me })
            void queryClient.invalidateQueries({ queryKey: ["authors"] })
        },
    })
}

export function useUpdateMeMutation() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (input: UpdateMyProfileInput) => profileApi.updateMe(input),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: queryKeys.me })
        },
    })
}

export function useUpdateMyAuthorProfileMutation() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (input: UpdateAuthorProfileInput) => profileApi.updateMyAuthorProfile(input),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: queryKeys.myAuthor })
            void queryClient.invalidateQueries({ queryKey: ["authors"] })
        },
    })
}
