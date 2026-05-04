import type { FeedPostDto } from "@shared/types/posts"
import { Search } from "lucide-react"
import type { RefObject } from "react"

import { LoadMorePostsButton } from "@/components/posts/LoadMorePostsButton"
import { PostFeed } from "@/components/posts/PostFeed"
import { PostFeedSkeleton } from "@/components/posts/PostFeedSkeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { Input } from "@/components/ui/input"
import type { FeedSourceFilter } from "@/types/navigation"
import { FeedSourceFilters } from "./FeedSourceFilters"

interface HomeFeedSectionProps {
    posts: FeedPostDto[]
    search: string
    deferredSearch: string
    source: FeedSourceFilter
    isSignedIn: boolean
    isLoading: boolean
    isError: boolean
    hasMore: boolean
    isLoadingMore: boolean
    errorMessage?: string
    sentinelRef: RefObject<HTMLDivElement | null>
    onSearchChange: (value: string) => void
    onSourceChange: (value: FeedSourceFilter) => void
    onRetry: () => void
    onLoadMore: () => void
}

export function HomeFeedSection({
    posts,
    search,
    deferredSearch,
    source,
    isSignedIn,
    isLoading,
    isError,
    hasMore,
    isLoadingMore,
    errorMessage,
    sentinelRef,
    onSearchChange,
    onSourceChange,
    onRetry,
    onLoadMore,
}: HomeFeedSectionProps) {
    const hasActiveFilter = Boolean(deferredSearch) || source !== "all"

    return (
        <Card className="rounded-[32px]">
            <CardHeader className="grid gap-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <div className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                            discovery feed
                        </div>
                        <CardTitle className="mt-3">Latest posts</CardTitle>
                    </div>
                    <Badge className="w-fit rounded-full" variant={isSignedIn ? "success" : "default"}>
                        {isSignedIn ? "Public + subscriptions" : "Public posts"}
                    </Badge>
                </div>
                <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
                    <label className="relative">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--muted)]" />
                        <Input
                            className="rounded-full pl-10"
                            onChange={(event) => onSearchChange(event.target.value)}
                            placeholder="Search posts by title or content"
                            value={search}
                        />
                    </label>
                    <FeedSourceFilters onChange={onSourceChange} value={source} />
                </div>
                {hasActiveFilter ? (
                    <p className="text-sm text-[var(--muted)]">
                        Showing {source === "all" ? "all sources" : source} posts
                        {deferredSearch ? ` matching "${deferredSearch}"` : ""}.
                    </p>
                ) : null}
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <PostFeedSkeleton />
                ) : isError ? (
                    <div className="mx-auto max-w-3xl rounded-2xl border border-rose-200 bg-rose-50/60 p-5">
                        <p className="text-sm text-rose-700">{errorMessage}</p>
                        <Button className="mt-4 rounded-full" onClick={onRetry} type="button" variant="outline">
                            Retry
                        </Button>
                    </div>
                ) : !posts.length ? (
                    <EmptyState
                        description={
                            hasActiveFilter
                                ? "Try another search phrase or switch the feed source filter."
                                : "Published posts will appear here once authors start sharing content."
                        }
                        title={hasActiveFilter ? "No posts match this discovery filter" : "No posts yet"}
                    />
                ) : (
                    <PostFeed emptyLabel="No public posts yet." posts={posts} showAuthor />
                )}
                <div ref={sentinelRef} />
                {isLoadingMore ? (
                    <div className="mt-5">
                        <PostFeedSkeleton count={1} />
                    </div>
                ) : null}
                <LoadMorePostsButton
                    hasMore={hasMore}
                    isLoadingMore={isLoadingMore}
                    onLoadMore={onLoadMore}
                />
            </CardContent>
        </Card>
    )
}
