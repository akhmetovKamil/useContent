import type { CreatePostInput, UpdatePostInput } from "@contracts/types/content"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { authorsApi } from "@/api/AuthorsApi"
import { postsApi } from "@/api/PostsApi"
import { queryKeys } from "./queryKeys"

export function useMyPostsQuery(enabled = true) {
    return useQuery({
        queryKey: queryKeys.myPosts,
        queryFn: () => postsApi.listMyPosts(),
        enabled,
    })
}

export function useAuthorPostsQuery(slug: string) {
    return useQuery({
        queryKey: queryKeys.authorPosts(slug),
        queryFn: () => authorsApi.listAuthorPosts(slug),
        enabled: Boolean(slug),
    })
}

export function useAuthorPostQuery(slug: string, postId: string) {
    return useQuery({
        queryKey: queryKeys.authorPost(slug, postId),
        queryFn: () => postsApi.getAuthorPost(slug, postId),
        enabled: Boolean(slug) && Boolean(postId),
    })
}

export function useCreateMyPostMutation() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (input: CreatePostInput) => postsApi.createMyPost(input),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: queryKeys.myPosts })
            void queryClient.invalidateQueries({ queryKey: ["authors"] })
        },
    })
}

export function useUpdateMyPostMutation() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ postId, input }: { postId: string; input: UpdatePostInput }) =>
            postsApi.updateMyPost(postId, input),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: queryKeys.myPosts })
            void queryClient.invalidateQueries({ queryKey: ["authors"] })
        },
    })
}

export function useDeleteMyPostMutation() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (postId: string) => postsApi.deleteMyPost(postId),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: queryKeys.myPosts })
            void queryClient.invalidateQueries({ queryKey: ["authors"] })
        },
    })
}
