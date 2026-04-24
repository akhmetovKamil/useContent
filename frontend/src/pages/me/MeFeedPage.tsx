import { useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"

import { PostFeed } from "@/components/posts/PostFeed"
import { PostFeedSkeleton } from "@/components/posts/PostFeedSkeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { Eyebrow, PageSection, PageTitle } from "@/components/ui/page"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { flattenFeedPages } from "@/queries/posts"
import { useMyFeedPostsQuery, useMyReaderSubscriptionsQuery } from "@/queries/profile"
import { useAuthStore } from "@/stores/auth-store"

const LAST_OPENED_KEY = "usecontent.meFeed.lastOpenedAt"

export function MeFeedPage() {
    const token = useAuthStore((state) => state.token)
    const [searchParams] = useSearchParams()
    const initialAuthorFilter = searchParams.get("author") ?? "all"
    const feedQuery = useMyFeedPostsQuery(Boolean(token))
    const subscriptionsQuery = useMyReaderSubscriptionsQuery(Boolean(token))
    const [authorFilter, setAuthorFilter] = useState(initialAuthorFilter)
    const [tierFilter, setTierFilter] = useState("all")
    const [freshOnly, setFreshOnly] = useState(false)
    const lastOpenedAt = useMemo(() => {
        const stored = window.localStorage.getItem(LAST_OPENED_KEY)
        window.localStorage.setItem(LAST_OPENED_KEY, new Date().toISOString())
        return stored ? new Date(stored).getTime() : 0
    }, [])
    const allPosts = flattenFeedPages(feedQuery.data)
    const subscriptions = subscriptionsQuery.data ?? []
    const authorOptions = useMemo(() => {
        const bySlug = new Map<string, string>()
        for (const subscription of subscriptions) {
            bySlug.set(subscription.authorSlug, subscription.authorDisplayName)
        }
        return [...bySlug.entries()]
            .map(([slug, displayName]) => ({ displayName, slug }))
            .sort((left, right) => left.displayName.localeCompare(right.displayName))
    }, [subscriptions])
    const tierOptions = useMemo(() => {
        const titles = new Set<string>()
        for (const subscription of subscriptions) {
            const title = subscription.planTitle ?? subscription.planCode
            if (title) {
                titles.add(title)
            }
        }
        return [...titles].sort((left, right) => left.localeCompare(right))
    }, [subscriptions])
    const posts = allPosts.filter((post) => {
        if (authorFilter !== "all" && post.authorSlug !== authorFilter) {
            return false
        }
        if (tierFilter !== "all" && post.accessLabel !== tierFilter) {
            return false
        }
        if (freshOnly) {
            const publishedAt = new Date(post.publishedAt ?? post.createdAt).getTime()
            return publishedAt > lastOpenedAt
        }
        return true
    })

    return (
        <section className="grid gap-6">
            <PageSection className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <Eyebrow>reader feed</Eyebrow>
                    <PageTitle>Subscriptions feed</PageTitle>
                    <p className="mt-4 max-w-2xl text-[var(--muted)]">
                        Latest posts from authors with active subscriptions attached to your wallet.
                    </p>
                </div>
                <Button asChild className="w-fit rounded-full" variant="outline">
                    <Link to="/me/subscriptions">Manage subscriptions</Link>
                </Button>
            </PageSection>

            <Card className="rounded-[28px]">
                <CardHeader className="gap-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle>All subscribed authors</CardTitle>
                            <div className="mt-2 flex flex-wrap gap-2">
                                <Badge className="rounded-full">{allPosts.length} loaded posts</Badge>
                                <Badge className="rounded-full" variant={freshOnly ? "success" : "default"}>
                                    {freshOnly ? "New only" : "All posts"}
                                </Badge>
                            </div>
                        </div>
                        <Button
                            className="w-fit rounded-full"
                            onClick={() => setFreshOnly((value) => !value)}
                            type="button"
                            variant={freshOnly ? "default" : "outline"}
                        >
                            New only
                        </Button>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                        <Select onValueChange={setAuthorFilter} value={authorFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="All authors" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All authors</SelectItem>
                                {authorOptions.map((author) => (
                                    <SelectItem key={author.slug} value={author.slug}>
                                        {author.displayName} (@{author.slug})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select onValueChange={setTierFilter} value={tierFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="All tiers" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All tiers</SelectItem>
                                {tierOptions.map((tier) => (
                                    <SelectItem key={tier} value={tier}>
                                        {tier}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    {feedQuery.isLoading ? (
                        <PostFeedSkeleton />
                    ) : feedQuery.isError ? (
                        <p className="text-rose-600">{feedQuery.error.message}</p>
                    ) : !posts.length ? (
                        <EmptyState
                            description={
                                allPosts.length
                                    ? "Try changing the author or tier filter."
                                    : "Posts from active subscriptions will appear here."
                            }
                            title="No subscribed posts"
                        />
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
