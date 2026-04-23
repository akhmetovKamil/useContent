import type {
    CreatePostCommentInput,
    CreatePostInput,
    PostDto,
    UpdatePostInput,
} from "@shared/types/content"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { authorsApi } from "@/api/AuthorsApi"
import { postsApi } from "@/api/PostsApi"
import { invalidateMany } from "@/queries/invalidate"
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
            const archiveKey = queryKeys.myPosts("archived")
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

            const nextPost = { ...existing, ...input, status: input.status }
            const removePost = (posts?: PostDto[]) => posts?.filter((post) => post.id !== postId)
            const addPost = (posts: PostDto[] | undefined, post: PostDto) => [
                post,
                ...(posts ?? []).filter((item) => item.id !== post.id),
            ]

            queryClient.setQueryData<PostDto[]>(activeKey, (posts) => removePost(posts) ?? [])
            queryClient.setQueryData<PostDto[]>(archiveKey, (posts) => removePost(posts) ?? [])

            if (input.status === "archived") {
                queryClient.setQueryData<PostDto[]>(archiveKey, (posts) => addPost(posts, nextPost))
            } else {
                queryClient.setQueryData<PostDto[]>(activeKey, (posts) => addPost(posts, nextPost))
            }

            return { previousActive, previousArchive }
        },
        onError: (_error, _variables, context) => {
            if (!context) {
                return
            }
            queryClient.setQueryData(queryKeys.myPosts(), context.previousActive)
            queryClient.setQueryData(queryKeys.myPosts("archived"), context.previousArchive)
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
        onSuccess: () => {
            void invalidateMany(queryClient, [queryKeys.myPosts(), queryKeys.authors()])
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
