import { ArrowUpRight, Search, UsersRound } from "lucide-react"
import { useCallback, useDeferredValue, useRef, useState } from "react"
import { Link } from "react-router-dom"

import { HomeHero } from "@/components/home-page/HomeHero"
import { PostFeed } from "@/components/posts/PostFeed"
import { PostFeedSkeleton } from "@/components/posts/PostFeedSkeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { Input } from "@/components/ui/input"
import { useInfiniteScrollSentinel } from "@/hooks/useInfiniteScrollSentinel"
import { useAuthorsQuery } from "@/queries/authors"
import { flattenFeedPages, useExploreFeedPostsQuery } from "@/queries/posts"
import { useMyAuthorProfileQuery } from "@/queries/profile"
import { useAuthStore } from "@/stores/auth-store"
import { cn } from "@/utils/cn"

type FeedSourceFilter = "all" | "public" | "subscribed" | "promoted"

const feedSourceFilters: Array<{ id: FeedSourceFilter; label: string }> = [
    { id: "all", label: "All" },
    { id: "public", label: "Public" },
    { id: "subscribed", label: "Subscribed" },
    { id: "promoted", label: "Promoted" },
]

export function HomePage() {
    const token = useAuthStore((state) => state.token)
    const [authorSearch, setAuthorSearch] = useState("")
    const [feedSearch, setFeedSearch] = useState("")
    const [feedSource, setFeedSource] = useState<FeedSourceFilter>("all")
    const deferredAuthorSearch = useDeferredValue(authorSearch)
    const deferredFeedSearch = useDeferredValue(feedSearch)
    const authorQuery = useMyAuthorProfileQuery(Boolean(token))
    const authorsQuery = useAuthorsQuery(Boolean(token), deferredAuthorSearch.trim())
    const feedQuery = useExploreFeedPostsQuery(true, {
        search: deferredFeedSearch.trim(),
        source: feedSource,
    })
    const feedPosts = flattenFeedPages(feedQuery.data)
    const feedSentinelRef = useRef<HTMLDivElement | null>(null)
    const loadMoreFeed = useCallback(() => {
        void feedQuery.fetchNextPage()
    }, [feedQuery])

    useInfiniteScrollSentinel({
        enabled: !feedQuery.isLoading && !feedQuery.isError,
        hasNextPage: Boolean(feedQuery.hasNextPage),
        isFetchingNextPage: feedQuery.isFetchingNextPage,
        onLoadMore: loadMoreFeed,
        sentinelRef: feedSentinelRef,
    })

    return (
        <div className="grid gap-6">
            <HomeHero authorSlug={authorQuery.data?.slug} isSignedIn={Boolean(token)} />
            <Card className="rounded-[32px]">
                <CardHeader className="grid gap-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <div className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                                discovery feed
                            </div>
                            <CardTitle className="mt-3">Latest posts</CardTitle>
                        </div>
                        <Badge className="w-fit rounded-full" variant={token ? "success" : "default"}>
                            {token ? "Public + subscriptions" : "Public posts"}
                        </Badge>
                    </div>
                    <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
                        <label className="relative">
                            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--muted)]" />
                            <Input
                                className="rounded-full pl-10"
                                onChange={(event) => setFeedSearch(event.target.value)}
                                placeholder="Search posts by title or content"
                                value={feedSearch}
                            />
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {feedSourceFilters.map((filter) => (
                                <button
                                    className={cn(
                                        "rounded-full border border-[var(--line)] px-4 py-2 text-sm font-medium transition",
                                        feedSource === filter.id
                                            ? "bg-[var(--foreground)] text-[var(--background)]"
                                            : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)]",
                                    )}
                                    key={filter.id}
                                    onClick={() => setFeedSource(filter.id)}
                                    type="button"
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    {deferredFeedSearch.trim() || feedSource !== "all" ? (
                        <p className="text-sm text-[var(--muted)]">
                            Showing {feedSource === "all" ? "all sources" : feedSource} posts
                            {deferredFeedSearch.trim()
                                ? ` matching "${deferredFeedSearch.trim()}"`
                                : ""}
                            .
                        </p>
                    ) : null}
                </CardHeader>
                <CardContent>
                    {feedQuery.isLoading ? (
                        <PostFeedSkeleton />
                    ) : feedQuery.isError ? (
                        <div className="mx-auto max-w-3xl rounded-2xl border border-rose-200 bg-rose-50/60 p-5">
                            <p className="text-sm text-rose-700">{feedQuery.error.message}</p>
                            <Button
                                className="mt-4 rounded-full"
                                onClick={() => void feedQuery.refetch()}
                                type="button"
                                variant="outline"
                            >
                                Retry
                            </Button>
                        </div>
                    ) : !feedPosts.length ? (
                        <EmptyState
                            description={
                                deferredFeedSearch.trim() || feedSource !== "all"
                                    ? "Try another search phrase or switch the feed source filter."
                                    : "Published posts will appear here once authors start sharing content."
                            }
                            title={
                                deferredFeedSearch.trim() || feedSource !== "all"
                                    ? "No posts match this discovery filter"
                                    : "No posts yet"
                            }
                        />
                    ) : (
                        <PostFeed
                            emptyLabel="No public posts yet."
                            posts={feedPosts}
                            showAuthor
                        />
                    )}
                    <div ref={feedSentinelRef} />
                    {feedQuery.isFetchingNextPage ? (
                        <div className="mt-5">
                            <PostFeedSkeleton count={1} />
                        </div>
                    ) : null}
                </CardContent>
            </Card>
            {token ? (
                <Card className="rounded-[32px]">
                    <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                                <UsersRound className="size-4" />
                                authors
                            </div>
                            <CardTitle className="mt-3">Explore creator spaces</CardTitle>
                        </div>
                        <label className="relative w-full sm:max-w-xs">
                            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--muted)]" />
                            <Input
                                className="rounded-full pl-10"
                                onChange={(event) => setAuthorSearch(event.target.value)}
                                placeholder="Search by name, tag, or username"
                                value={authorSearch}
                            />
                        </label>
                    </CardHeader>
                    <CardContent>
                        {authorsQuery.isLoading ? (
                            <p className="text-sm text-[var(--muted)]">Loading authors...</p>
                        ) : authorsQuery.isError ? (
                            <p className="text-sm text-rose-600">{authorsQuery.error.message}</p>
                        ) : authorsQuery.data?.length ? (
                            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                {authorsQuery.data.map((author) => (
                                    <Link
                                        className="group rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-5 transition hover:-translate-y-0.5 hover:bg-[var(--accent-soft)]"
                                        key={author.id}
                                        to={`/authors/${author.slug}`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="text-lg font-medium text-[var(--foreground)]">
                                                    {author.displayName}
                                                </div>
                                                <div className="mt-1 font-mono text-sm text-[var(--muted)]">
                                                    @{author.slug}
                                                </div>
                                            </div>
                                            <ArrowUpRight className="size-5 text-[var(--muted)] transition group-hover:text-[var(--foreground)]" />
                                        </div>
                                        <p className="mt-4 line-clamp-2 text-sm leading-6 text-[var(--muted)]">
                                            {author.bio || "No profile description yet."}
                                        </p>
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            <Badge>{author.postsCount} posts</Badge>
                                            <Badge>{author.subscriptionPlansCount} tiers</Badge>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-[24px] border border-dashed border-[var(--line)] p-6">
                                <p className="text-sm text-[var(--muted)]">
                                    {deferredAuthorSearch.trim()
                                        ? "No authors match this search yet."
                                        : "No authors yet. The first creator space will appear here."}
                                </p>
                                {authorQuery.data?.slug ? (
                                    <Button asChild className="mt-4 rounded-full" variant="outline">
                                        <Link to={`/authors/${authorQuery.data.slug}`}>
                                            Open your author profile
                                        </Link>
                                    </Button>
                                ) : null}
                            </div>
                        )}
                    </CardContent>
                </Card>
            ) : null}
        </div>
    )
}
