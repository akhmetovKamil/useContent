import type {
    CreatePostCommentInput,
    CreatePostInput,
    PostDto,
    UpdatePostInput,
} from "@contracts/types/content"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { authorsApi } from "@/api/AuthorsApi"
import { postsApi } from "@/api/PostsApi"
import { queryKeys } from "./queryKeys"

export function useMyPostsQuery(enabled = true, status?: PostDto["status"]) {
    return useQuery({
        queryKey: queryKeys.myPosts(status),
        queryFn: () => postsApi.listMyPosts(status),
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

export function usePostCommentsQuery(slug: string, postId: string, enabled = true) {
    return useQuery({
        queryKey: queryKeys.postComments(slug, postId),
        queryFn: () => postsApi.listPostComments(slug, postId),
        enabled: enabled && Boolean(slug) && Boolean(postId),
    })
}

export function useCreateMyPostMutation() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (input: CreatePostInput) => postsApi.createMyPost(input),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ["me", "posts"] })
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
            void queryClient.invalidateQueries({ queryKey: ["me", "posts"] })
            void queryClient.invalidateQueries({ queryKey: ["authors"] })
        },
    })
}

export function useDeleteMyPostMutation() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (postId: string) => postsApi.deleteMyPost(postId),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ["me", "posts"] })
            void queryClient.invalidateQueries({ queryKey: ["authors"] })
        },
    })
}

export function useCreatePostCommentMutation(slug: string, postId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (input: CreatePostCommentInput) =>
            postsApi.createPostComment(slug, postId, input),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: queryKeys.postComments(slug, postId) })
            void queryClient.invalidateQueries({ queryKey: queryKeys.authorPost(slug, postId) })
            void queryClient.invalidateQueries({ queryKey: queryKeys.authorPosts(slug) })
            void queryClient.invalidateQueries({ queryKey: queryKeys.myFeedPosts })
        },
    })
}

export function useTogglePostLikeMutation(slug: string, postId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: () => postsApi.togglePostLike(slug, postId),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: queryKeys.authorPost(slug, postId) })
            void queryClient.invalidateQueries({ queryKey: queryKeys.authorPosts(slug) })
            void queryClient.invalidateQueries({ queryKey: queryKeys.myFeedPosts })
        },
    })
}
