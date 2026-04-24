import type { FeedPostDto } from "@shared/types/content"
import { LockKeyhole } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import { useEffect, useMemo } from "react"
import { Link, useParams } from "react-router-dom"

import { InlineComments } from "@/components/posts/InlineComments"
import { PostCard } from "@/components/posts/PostCard"
import { PostFeed } from "@/components/posts/PostFeed"
import { PostFeedSkeleton } from "@/components/posts/PostFeedSkeleton"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { useAuthorProfileQuery } from "@/queries/authors"
import {
    flattenFeedPages,
    useAuthorPostQuery,
    useAuthorPostsQuery,
    useCreatePostCommentMutation,
    usePostCommentsQuery,
    useRecordPostViewMutation,
} from "@/queries/posts"
import { useAuthStore } from "@/stores/auth-store"
import { isApiPermissionError } from "@/utils/api/errors"

export function PostPage() {
    const { slug = "", postId = "" } = useParams()
    const token = useAuthStore((state) => state.token)
    const postQuery = useAuthorPostQuery(slug, postId)
    const authorQuery = useAuthorProfileQuery(slug)
    const relatedPostsQuery = useAuthorPostsQuery(slug)
    const commentsQuery = usePostCommentsQuery(slug, postId, Boolean(postQuery.data))
    const commentMutation = useCreatePostCommentMutation(slug, postId)
    const recordViewMutation = useRecordPostViewMutation(slug, postId)
    const viewerKey = useMemo(() => getViewerKey(), [])
    const author = authorQuery.data
    const post = postQuery.data
    const feedPost = post && author ? toFeedPost(post, author.displayName, author.slug) : null
    const relatedPosts = flattenFeedPages(relatedPostsQuery.data)
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
                <Card className="rounded-[32px]">
                    <CardContent className="grid gap-4 p-6">
                        <div className="grid size-12 place-items-center rounded-2xl bg-[var(--surface-strong)]">
                            <LockKeyhole className="size-5" />
                        </div>
                        <div>
                            <CardTitle>This post is locked</CardTitle>
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                                Open the author profile to view access tiers and unlock this
                                content with a subscription or ownership condition.
                            </p>
                        </div>
                        <Button asChild className="w-fit rounded-full">
                            <Link to={`/authors/${slug}`}>View access tiers</Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : null}

            {postQuery.isError && !isLocked ? (
                <Card className="rounded-[32px] border-rose-200">
                    <CardContent className="p-6 text-sm text-rose-600">
                        Failed to open @{slug}'s post: {postQuery.error.message}
                    </CardContent>
                </Card>
            ) : null}

            {feedPost ? (
                <>
                    <PostCard commentsMode="hidden" post={feedPost} showAuthor />

                    <Card className="rounded-[32px]">
                        <CardHeader>
                            <CardTitle>Comments</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <InlineComments
                                authorId={feedPost.authorId}
                                comments={commentsQuery.data}
                                isError={commentsQuery.isError}
                                isLoading={commentsQuery.isLoading}
                                isPending={commentMutation.isPending}
                                onSubmit={(content) => commentMutation.mutateAsync({ content })}
                                token={token}
                            />
                        </CardContent>
                    </Card>
                </>
            ) : null}

            {relatedPosts.length ? (
                <Card className="rounded-[32px]">
                    <CardHeader>
                        <CardTitle>More from {author?.displayName ?? `@${slug}`}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <PostFeed emptyLabel="No related posts yet." posts={relatedPosts} />
                    </CardContent>
                </Card>
            ) : !postQuery.isLoading && !isLocked && !postQuery.isError ? (
                <EmptyState
                    description="Related posts from this author will appear here."
                    title="No related posts"
                />
            ) : null}
        </section>
    )
}

function toFeedPost(
    post: ReturnType<typeof useAuthorPostQuery>["data"],
    authorDisplayName: string,
    authorSlug: string
): FeedPostDto {
    if (!post) {
        throw new Error("post is required")
    }

    return {
        ...post,
        accessLabel:
            post.policyMode === "public"
                ? "Public"
                : post.policyMode === "custom"
                  ? "Custom tier"
                  : "Default tier",
        authorDisplayName,
        authorSlug,
        commentsPreview: [],
        feedReason: `From @${authorSlug}`,
        feedSource: "author",
        hasAccess: true,
    }
}

function getViewerKey() {
    const key = "usecontent.viewerKey"
    const existing = window.localStorage.getItem(key)
    if (existing) {
        return existing
    }

    const next = uuidv4()
    window.localStorage.setItem(key, next)
    return next
}
