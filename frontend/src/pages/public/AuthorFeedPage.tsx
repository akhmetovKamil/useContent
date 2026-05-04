import { useCallback, useRef } from "react"
import { Link, useParams } from "react-router-dom"

import { LoadMorePostsButton } from "@/components/posts/LoadMorePostsButton"
import { PostFeed } from "@/components/posts/PostFeed"
import { PostFeedSkeleton } from "@/components/posts/PostFeedSkeleton"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { Eyebrow, PageSection, PageTitle } from "@/components/ui/page"
import { useInfiniteScrollSentinel } from "@/hooks/useInfiniteScrollSentinel"
import { useAuthorProfileQuery } from "@/queries/authors"
import { useAuthorPostsQuery } from "@/queries/posts"

export function AuthorFeedPage() {
    const { slug } = useParams()
    const authorSlug = slug ?? ""
    const authorQuery = useAuthorProfileQuery(authorSlug)
    const postsQuery = useAuthorPostsQuery(authorSlug)
    const posts = postsQuery.items
    const sentinelRef = useRef<HTMLDivElement | null>(null)
    const loadMore = useCallback(() => {
        postsQuery.loadMore()
    }, [postsQuery])

    useInfiniteScrollSentinel({
        enabled: !postsQuery.isLoading && !postsQuery.isError,
        hasNextPage: postsQuery.hasMore,
        isFetchingNextPage: postsQuery.isLoadingMore,
        onLoadMore: loadMore,
        sentinelRef,
    })

    return (
        <section className="grid gap-6">
            <PageSection>
                <Eyebrow>author feed</Eyebrow>
                <PageTitle>
                    Posts by{" "}
                    {authorQuery.data
                        ? `${authorQuery.data.displayName} (@${authorQuery.data.slug})`
                        : `@${authorSlug}`}
                </PageTitle>
                <div className="mt-5 flex flex-wrap gap-3">
                    <Button asChild className="rounded-full" variant="outline">
                        <Link to={`/authors/${authorSlug}`}>Author profile</Link>
                    </Button>
                    <Button asChild className="rounded-full" variant="outline">
                        <Link to={`/authors/${authorSlug}#projects`}>Projects</Link>
                    </Button>
                </div>
            </PageSection>

            <Card className="rounded-[28px]">
                <CardHeader>
                    <CardTitle>Posts</CardTitle>
                </CardHeader>
                <CardContent>
                    {postsQuery.isLoading ? (
                        <PostFeedSkeleton />
                    ) : postsQuery.isError ? (
                        <p className="text-rose-600">{postsQuery.error.message}</p>
                    ) : !posts.length ? (
                        <EmptyState
                            description="Published posts from this author will appear here."
                            title="No posts yet"
                        />
                    ) : (
                        <PostFeed emptyLabel="No posts yet." posts={posts} />
                    )}
                    <div ref={sentinelRef} />
                    {postsQuery.isLoadingMore ? <PostFeedSkeleton count={1} /> : null}
                    <LoadMorePostsButton
                        hasMore={postsQuery.hasMore}
                        isLoadingMore={postsQuery.isLoadingMore}
                        onLoadMore={postsQuery.loadMore}
                    />
                </CardContent>
            </Card>
        </section>
    )
}
