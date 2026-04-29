import type { CreateAuthorProfileInput, UpdateAuthorProfileInput, UpdateMyProfileInput } from "@shared/types/profile"
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { profileApi } from "@/api/ProfileApi"
import { invalidateMany } from "@/queries/invalidate"
import { withInfiniteItems } from "@/queries/infinite"
import { useWorkspaceStore } from "@/stores/workspace-store"
import { isApiNotFoundError } from "@/utils/api/errors"
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
        queryFn: async () => {
            try {
                return await profileApi.getMyAuthorProfile()
            } catch (error) {
                if (isApiNotFoundError(error)) {
                    return null
                }

                throw error
            }
        },
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

export function useMyReaderSubscriptionsQuery(enabled = true) {
    return useQuery({
        queryKey: queryKeys.myReaderSubscriptions,
        queryFn: () => profileApi.getMyReaderSubscriptions(),
        enabled,
    })
}

export function useMyFeedPostsQuery(enabled = true) {
    const query = useInfiniteQuery({
        queryKey: queryKeys.myFeedPosts,
        queryFn: ({ pageParam }) => profileApi.getMyFeedPosts(pageParam),
        enabled,
        initialPageParam: null as string | null,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
    })

    return withInfiniteItems(query)
}

export function useMyAuthorSubscribersQuery(enabled = true) {
    return useQuery({
        queryKey: queryKeys.myAuthorSubscribers,
        queryFn: () => profileApi.getMyAuthorSubscribers(),
        enabled,
    })
}

export function useCreateMyAuthorProfileMutation() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (input: CreateAuthorProfileInput) => profileApi.createMyAuthorProfile(input),
        onSuccess: (author) => {
            useWorkspaceStore.getState().setHasAuthorProfileHint(true)
            queryClient.setQueryData(queryKeys.myAuthor, author)
            void invalidateMany(queryClient, [
                queryKeys.myAuthor,
                queryKeys.me,
                queryKeys.authors(),
            ])
        },
    })
}

export function useUpdateMeMutation() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (input: UpdateMyProfileInput) => profileApi.updateMe(input),
        onSuccess: () => {
            void invalidateMany(queryClient, [queryKeys.me])
        },
    })
}

export function useUpdateMyAuthorProfileMutation() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (input: UpdateAuthorProfileInput) => profileApi.updateMyAuthorProfile(input),
        onSuccess: () => {
            void invalidateMany(queryClient, [queryKeys.myAuthor, queryKeys.authors()])
        },
    })
}

export function useDeleteMyAuthorProfileMutation() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: () => profileApi.deleteMyAuthorProfile(),
        onSuccess: () => {
            useWorkspaceStore.getState().setHasAuthorProfileHint(false)
            queryClient.setQueryData(queryKeys.myAuthor, null)
            void invalidateMany(queryClient, [
                queryKeys.myAuthor,
                queryKeys.me,
                queryKeys.authors(),
            ])
        },
    })
}
