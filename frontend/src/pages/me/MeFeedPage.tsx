import { PostFeed } from "@/components/posts/PostFeed"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eyebrow, PageSection, PageTitle } from "@/components/ui/page"
import { useMyFeedPostsQuery } from "@/queries/profile"
import { useAuthStore } from "@/stores/auth-store"

export function MeFeedPage() {
    const token = useAuthStore((state) => state.token)
    const feedQuery = useMyFeedPostsQuery(Boolean(token))

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
                            posts={feedQuery.data}
                            showAuthor
                        />
                    )}
                </CardContent>
            </Card>
        </section>
    )
}
