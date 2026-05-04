import { useEffect, useMemo } from "react"
import { useParams } from "react-router-dom"

import { LockedPostCard } from "@/components/post-page/LockedPostCard"
import { PostCommentsSection } from "@/components/post-page/PostCommentsSection"
import { PostErrorCard } from "@/components/post-page/PostErrorCard"
import { RelatedPostsSection } from "@/components/post-page/RelatedPostsSection"
import { PostCard } from "@/components/posts/PostCard"
import { PostFeedSkeleton } from "@/components/posts/PostFeedSkeleton"
import { useAuthorProfileQuery } from "@/queries/authors"
import {
    useAuthorPostQuery,
    useAuthorPostsQuery,
    useCreatePostCommentMutation,
    usePostCommentsQuery,
    useRecordPostViewMutation,
} from "@/queries/posts"
import { useAuthStore } from "@/stores/auth-store"
import { isApiPermissionError } from "@/utils/api/errors"
import { getPostViewerKey, toAuthorFeedPost } from "@/utils/post-page"

export function PostPage() {
    const { slug = "", postId = "" } = useParams()
    const token = useAuthStore((state) => state.token)
    const postQuery = useAuthorPostQuery(slug, postId)
    const authorQuery = useAuthorProfileQuery(slug)
    const relatedPostsQuery = useAuthorPostsQuery(slug)
    const commentsQuery = usePostCommentsQuery(slug, postId, Boolean(postQuery.data))
    const commentMutation = useCreatePostCommentMutation(slug, postId)
    const recordViewMutation = useRecordPostViewMutation(slug, postId)
    const viewerKey = useMemo(() => getPostViewerKey(), [])
    const author = authorQuery.data
    const post = postQuery.data
    const feedPost =
        post && author
            ? toAuthorFeedPost(post, author.displayName, author.slug, author.avatarFileId)
            : null
    const relatedPosts = relatedPostsQuery.items
        .filter((item) => item.id !== postId)
        .slice(0, 3)
    const isLocked = postQuery.isError && isApiPermissionError(postQuery.error)

    useEffect(() => {
        if (post && slug && postId && viewerKey) {
            void recordViewMutation.mutateAsync(viewerKey)
        }
    }, [post?.id, postId, slug, viewerKey])

    return (
        <section className="grid gap-6">
            {postQuery.isLoading ? <PostFeedSkeleton count={1} /> : null}

            {isLocked ? (
                <LockedPostCard slug={slug} />
            ) : null}

            {postQuery.isError && !isLocked ? (
                <PostErrorCard message={postQuery.error.message} slug={slug} />
            ) : null}

            {feedPost ? (
                <>
                    <PostCard commentsMode="hidden" post={feedPost} showAuthor />

                    <PostCommentsSection
                        authorId={feedPost.authorId}
                        comments={commentsQuery.data}
                        isError={commentsQuery.isError}
                        isLoading={commentsQuery.isLoading}
                        isPending={commentMutation.isPending}
                        onSubmit={(content) => commentMutation.mutateAsync({ content })}
                        token={token}
                    />
                </>
            ) : null}

            <RelatedPostsSection
                authorLabel={author?.displayName ?? `@${slug}`}
                isHidden={postQuery.isLoading || isLocked || postQuery.isError}
                posts={relatedPosts}
            />
        </section>
    )
}
