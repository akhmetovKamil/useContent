import { PostFeed } from "@/components/posts/PostFeed"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eyebrow, PageSection, PageTitle } from "@/components/ui/page"
import { flattenFeedPages } from "@/queries/posts"
import { useMyFeedPostsQuery } from "@/queries/profile"
import { useAuthStore } from "@/stores/auth-store"

export function MeFeedPage() {
    const token = useAuthStore((state) => state.token)
    const feedQuery = useMyFeedPostsQuery(Boolean(token))
    const posts = flattenFeedPages(feedQuery.data)

    return (
        <section className="grid gap-6">
            <PageSection>
                <Eyebrow>reader feed</Eyebrow>
                <PageTitle>Post feed</PageTitle>
                <p className="mt-4 max-w-2xl text-[var(--muted)]">
                    Latest posts from authors with active subscriptions attached to your wallet.
                </p>
            </PageSection>

            <Card className="rounded-[28px]">
                <CardHeader>
                    <CardTitle>All subscribed authors</CardTitle>
                </CardHeader>
                <CardContent>
                    {feedQuery.isLoading ? (
                        <p className="text-[var(--muted)]">Loading feed...</p>
                    ) : feedQuery.isError ? (
                        <p className="text-rose-600">{feedQuery.error.message}</p>
                    ) : (
                        <PostFeed
                            emptyLabel="No posts from your subscriptions yet."
                            posts={posts}
                            showAuthor
                        />
                    )}
                    {feedQuery.hasNextPage ? (
                        <Button
                            className="mt-5 rounded-full"
                            disabled={feedQuery.isFetchingNextPage}
                            onClick={() => void feedQuery.fetchNextPage()}
                            type="button"
                            variant="outline"
                        >
                            {feedQuery.isFetchingNextPage ? "Loading..." : "Load more"}
                        </Button>
                    ) : null}
                </CardContent>
            </Card>
        </section>
    )
}
