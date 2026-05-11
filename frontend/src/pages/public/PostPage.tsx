import { useEffect, useMemo } from "react"
import { useParams } from "react-router-dom"

import { LockedPostCard } from "@/components/post-page/LockedPostCard"
import { PostErrorCard } from "@/components/post-page/PostErrorCard"
import { RelatedPostsSection } from "@/components/post-page/RelatedPostsSection"
import { PostCard } from "@/components/posts/PostCard"
import { PostFeedSkeleton } from "@/components/posts/PostFeedSkeleton"
import { useAuthorProfileQuery } from "@/queries/authors"
import {
    useAuthorPostQuery,
    useAuthorPostsQuery,
    useRecordPostViewMutation,
} from "@/queries/posts"
import { isApiPermissionError } from "@/utils/api/errors"
import { getPostViewerKey, toAuthorFeedPost } from "@/utils/post-page"

export function PostPage() {
    const { slug = "", postId = "" } = useParams()
    const postQuery = useAuthorPostQuery(slug, postId)
    const authorQuery = useAuthorProfileQuery(slug)
    const relatedPostsQuery = useAuthorPostsQuery(slug)
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
                    <PostCard post={feedPost} showAuthor />
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
