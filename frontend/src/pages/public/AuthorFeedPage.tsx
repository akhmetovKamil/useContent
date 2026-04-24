import { Link, useParams } from "react-router-dom"

import { PostFeed } from "@/components/posts/PostFeed"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eyebrow, PageSection, PageTitle } from "@/components/ui/page"
import { useAuthorProfileQuery } from "@/queries/authors"
import { flattenFeedPages, useAuthorPostsQuery } from "@/queries/posts"

export function AuthorFeedPage() {
    const { slug } = useParams()
    const authorSlug = slug ?? ""
    const authorQuery = useAuthorProfileQuery(authorSlug)
    const postsQuery = useAuthorPostsQuery(authorSlug)
    const posts = flattenFeedPages(postsQuery.data)

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
                        <p className="text-[var(--muted)]">Loading posts...</p>
                    ) : postsQuery.isError ? (
                        <p className="text-rose-600">{postsQuery.error.message}</p>
                    ) : (
                        <PostFeed emptyLabel="No posts yet." posts={posts} />
                    )}
                    {postsQuery.hasNextPage ? (
                        <Button
                            className="mt-5 rounded-full"
                            disabled={postsQuery.isFetchingNextPage}
                            onClick={() => void postsQuery.fetchNextPage()}
                            type="button"
                            variant="outline"
                        >
                            {postsQuery.isFetchingNextPage ? "Loading..." : "Load more"}
                        </Button>
                    ) : null}
                </CardContent>
            </Card>
        </section>
    )
}
