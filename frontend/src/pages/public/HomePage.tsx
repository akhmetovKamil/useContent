import { useCallback, useDeferredValue, useRef, useState } from "react"

import { AuthorDiscoverySection } from "@/components/home-page/AuthorDiscoverySection"
import { HomeFeedSection } from "@/components/home-page/HomeFeedSection"
import { HomeHero } from "@/components/home-page/HomeHero"
import { useInfiniteScrollSentinel } from "@/hooks/useInfiniteScrollSentinel"
import { useAuthorsQuery } from "@/queries/authors"
import { useExploreFeedPostsQuery } from "@/queries/posts"
import { useMyAuthorProfileQuery } from "@/queries/profile"
import { useAuthStore } from "@/stores/auth-store"
import type { FeedSourceFilter } from "@/types/navigation"

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
    const feedPosts = feedQuery.items
    const feedSentinelRef = useRef<HTMLDivElement | null>(null)
    const loadMoreFeed = useCallback(() => {
        feedQuery.loadMore()
    }, [feedQuery])

    useInfiniteScrollSentinel({
        enabled: !feedQuery.isLoading && !feedQuery.isError,
        hasNextPage: feedQuery.hasMore,
        isFetchingNextPage: feedQuery.isLoadingMore,
        onLoadMore: loadMoreFeed,
        sentinelRef: feedSentinelRef,
    })

    return (
        <div className="grid gap-6">
            <HomeHero authorSlug={authorQuery.data?.slug} isSignedIn={Boolean(token)} />
            <HomeFeedSection
                deferredSearch={deferredFeedSearch.trim()}
                errorMessage={feedQuery.error?.message}
                isError={feedQuery.isError}
                isLoading={feedQuery.isLoading}
                isLoadingMore={feedQuery.isLoadingMore}
                isSignedIn={Boolean(token)}
                onRetry={() => void feedQuery.refetch()}
                onSearchChange={setFeedSearch}
                onSourceChange={setFeedSource}
                posts={feedPosts}
                search={feedSearch}
                sentinelRef={feedSentinelRef}
                source={feedSource}
            />
            {token ? (
                <AuthorDiscoverySection
                    authorSlug={authorQuery.data?.slug}
                    authors={authorsQuery.data ?? []}
                    deferredSearch={deferredAuthorSearch.trim()}
                    errorMessage={authorsQuery.error?.message}
                    isError={authorsQuery.isError}
                    isLoading={authorsQuery.isLoading}
                    onSearchChange={setAuthorSearch}
                    search={authorSearch}
                />
            ) : null}
        </div>
    )
}
