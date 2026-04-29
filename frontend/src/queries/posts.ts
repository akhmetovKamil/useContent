import { CONTENT_STATUS } from "@shared/consts"
import type { CreatePostCommentInput, CreatePostInput, CreatePostReportInput, PostDto, UpdatePostInput } from "@shared/types/posts"
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { authorsApi } from "@/api/AuthorsApi"
import { postsApi } from "@/api/PostsApi"
import { withInfiniteItems } from "@/queries/infinite"
import { invalidateMany } from "@/queries/invalidate"
import {
    invalidatePostCollections,
    moveMyPostBetweenStatusLists,
    removeEntityById,
} from "@/queries/post-cache"
import { queryKeys } from "./queryKeys"

export function useMyPostsQuery(enabled = true, status?: PostDto["status"]) {
    return useQuery({
        queryKey: queryKeys.myPosts(status),
        queryFn: () => postsApi.listMyPosts(status),
        enabled,
    })
}

export function useAuthorPostsQuery(slug: string) {
    const query = useInfiniteQuery({
        queryKey: queryKeys.authorPosts(slug),
        queryFn: ({ pageParam }) => authorsApi.listAuthorPosts(slug, pageParam),
        enabled: Boolean(slug),
        initialPageParam: null as string | null,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
    })

    return withInfiniteItems(query)
}

export function useExploreFeedPostsQuery(
    enabled = true,
    filters: {
        search?: string
        source?: "all" | "public" | "subscribed" | "promoted"
    } = {}
) {
    const search = filters.search?.trim() ?? ""
    const source = filters.source ?? "all"
    const query = useInfiniteQuery({
        queryKey: queryKeys.exploreFeedPosts(search, source),
        queryFn: ({ pageParam }) =>
            authorsApi.listExploreFeedPosts({ cursor: pageParam, q: search, source }),
        enabled,
        initialPageParam: null as string | null,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
    })

    return withInfiniteItems(query)
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
            void invalidateMany(queryClient, [queryKeys.myPosts(), queryKeys.authors()])
        },
    })
}

export function useUpdateMyPostMutation() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ postId, input }: { postId: string; input: UpdatePostInput }) =>
            postsApi.updateMyPost(postId, input),
        onMutate: async ({ postId, input }) => {
            if (!input.status) {
                return
            }

            const activeKey = queryKeys.myPosts()
            const archiveKey = queryKeys.myPosts(CONTENT_STATUS.ARCHIVED)
            await Promise.all([
                queryClient.cancelQueries({ queryKey: activeKey }),
                queryClient.cancelQueries({ queryKey: archiveKey }),
            ])

            const previousActive = queryClient.getQueryData<PostDto[]>(activeKey)
            const previousArchive = queryClient.getQueryData<PostDto[]>(archiveKey)
            const existing = [...(previousActive ?? []), ...(previousArchive ?? [])].find(
                (post) => post.id === postId
            )

            if (!existing) {
                return { previousActive, previousArchive }
            }

            moveMyPostBetweenStatusLists(queryClient, { ...existing, ...input }, input.status)

            return { previousActive, previousArchive }
        },
        onError: (_error, _variables, context) => {
            if (!context) {
                return
            }
            queryClient.setQueryData(queryKeys.myPosts(), context.previousActive)
            queryClient.setQueryData(
                queryKeys.myPosts(CONTENT_STATUS.ARCHIVED),
                context.previousArchive
            )
        },
        onSuccess: () => {
            void invalidateMany(queryClient, [queryKeys.myPosts(), queryKeys.authors()])
        },
    })
}

export function useDeleteMyPostMutation() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (postId: string) => postsApi.deleteMyPost(postId),
        onMutate: async (postId) => {
            const activeKey = queryKeys.myPosts()
            const archiveKey = queryKeys.myPosts(CONTENT_STATUS.ARCHIVED)
            await Promise.all([
                queryClient.cancelQueries({ queryKey: activeKey }),
                queryClient.cancelQueries({ queryKey: archiveKey }),
            ])
            const previousActive = queryClient.getQueryData<PostDto[]>(activeKey)
            const previousArchive = queryClient.getQueryData<PostDto[]>(archiveKey)
            queryClient.setQueryData<PostDto[]>(activeKey, (posts) =>
                removeEntityById(posts, postId)
            )
            queryClient.setQueryData<PostDto[]>(archiveKey, (posts) =>
                removeEntityById(posts, postId)
            )
            return { previousActive, previousArchive }
        },
        onError: (_error, _postId, context) => {
            if (!context) {
                return
            }
            queryClient.setQueryData(queryKeys.myPosts(), context.previousActive)
            queryClient.setQueryData(
                queryKeys.myPosts(CONTENT_STATUS.ARCHIVED),
                context.previousArchive
            )
        },
        onSettled: () => {
            void invalidateMany(queryClient, [queryKeys.myPosts(), queryKeys.authors()])
        },
    })
}

export function usePromoteMyPostMutation() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (postId: string) => postsApi.promoteMyPost(postId),
        onSuccess: () => {
            void invalidatePostCollections(queryClient)
        },
    })
}

export function useStopPromotingMyPostMutation() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (postId: string) => postsApi.stopPromotingMyPost(postId),
        onSuccess: () => {
            void invalidatePostCollections(queryClient)
        },
    })
}

export function useUploadMyPostAttachmentMutation() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ postId, file }: { postId: string; file: File }) =>
            postsApi.uploadMyPostAttachment(postId, file),
        onSuccess: () => {
            void invalidateMany(queryClient, [queryKeys.myPosts(), queryKeys.authors()])
        },
    })
}

export function useDownloadMyPostAttachmentMutation() {
    return useMutation({
        mutationFn: ({
            postId,
            attachmentId,
            fileName,
        }: {
            postId: string
            attachmentId: string
            fileName: string
        }) => postsApi.downloadMyPostAttachment(postId, attachmentId, fileName),
    })
}

export function useDownloadAuthorPostAttachmentMutation(slug: string, postId: string) {
    return useMutation({
        mutationFn: ({ attachmentId, fileName }: { attachmentId: string; fileName: string }) =>
            postsApi.downloadAuthorPostAttachment(slug, postId, attachmentId, fileName),
    })
}

export function useCreatePostCommentMutation(slug: string, postId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (input: CreatePostCommentInput) =>
            postsApi.createPostComment(slug, postId, input),
        onSuccess: () => {
            void invalidateMany(queryClient, [
                queryKeys.postComments(slug, postId),
                queryKeys.authorPost(slug, postId),
                queryKeys.authorPosts(slug),
                queryKeys.myFeedPosts,
            ])
        },
    })
}

export function useCreatePostReportMutation(slug: string, postId: string) {
    return useMutation({
        mutationFn: (input: CreatePostReportInput) =>
            postsApi.createPostReport(slug, postId, input),
    })
}

export function useTogglePostLikeMutation(slug: string, postId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: () => postsApi.togglePostLike(slug, postId),
        onSuccess: () => {
            void invalidateMany(queryClient, [
                queryKeys.authorPost(slug, postId),
                queryKeys.authorPosts(slug),
                queryKeys.myFeedPosts,
            ])
        },
    })
}

export function useRecordPostViewMutation(slug: string, postId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (viewerKey: string) => postsApi.recordPostView(slug, postId, { viewerKey }),
        onSuccess: () => {
            void invalidateMany(queryClient, [queryKeys.authorPost(slug, postId)])
        },
    })
}
