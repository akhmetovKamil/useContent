import { ShieldCheck } from "lucide-react"
import { useCallback, useRef, useState } from "react"
import { Link, useParams } from "react-router-dom"

import { LoadMorePostsButton } from "@/components/posts/LoadMorePostsButton"
import { PostFeed } from "@/components/posts/PostFeed"
import { PostFeedSkeleton } from "@/components/posts/PostFeedSkeleton"
import { ProjectList } from "@/components/projects/ProjectList"
import { PublicTierCard } from "@/components/public-author/PublicTierCard"
import { TierCard } from "@/components/public-author/TierCard"
import { TierDrawer } from "@/components/public-author/TierDrawer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { ErrorMessage, LoadingMessage } from "@/components/ui/query-state"
import { useInfiniteScrollSentinel } from "@/hooks/useInfiniteScrollSentinel"
import { useAuthorAccessPoliciesQuery, useAuthorProfileQuery } from "@/queries/authors"
import { useAuthorPostsQuery } from "@/queries/posts"
import { useAuthorProjectsQuery } from "@/queries/projects"

export function AuthorPage() {
    const { slug } = useParams()
    const authorSlug = slug ?? ""
    const authorQuery = useAuthorProfileQuery(authorSlug)
    const postsQuery = useAuthorPostsQuery(authorSlug)
    const projectsQuery = useAuthorProjectsQuery(authorSlug)
    const policiesQuery = useAuthorAccessPoliciesQuery(authorSlug)
    const [selectedTierId, setSelectedTierId] = useState<string | null>(null)
    const selectedTier = policiesQuery.data?.find((policy) => policy.id === selectedTierId) ?? null
    const posts = postsQuery.items
    const postSentinelRef = useRef<HTMLDivElement | null>(null)
    const loadMorePosts = useCallback(() => {
        postsQuery.loadMore()
    }, [postsQuery])

    useInfiniteScrollSentinel({
        enabled: !postsQuery.isLoading && !postsQuery.isError,
        hasNextPage: postsQuery.hasMore,
        isFetchingNextPage: postsQuery.isLoadingMore,
        onLoadMore: loadMorePosts,
        sentinelRef: postSentinelRef,
    })

    return (
        <section className="grid gap-6">
            {authorQuery.isLoading ? (
                <Card className="rounded-[28px]">
                    <CardContent className="pt-6">
                        <LoadingMessage>Loading public profile...</LoadingMessage>
                    </CardContent>
                </Card>
            ) : authorQuery.isError ? (
                <Card className="rounded-[28px]">
                    <CardContent className="pt-6">
                        <ErrorMessage>{`Author profile was not found: ${authorQuery.error.message}`}</ErrorMessage>
                    </CardContent>
                </Card>
            ) : authorQuery.data ? (
                <>
                    <Card className="overflow-hidden rounded-[32px]">
                        <CardHeader className="bg-[var(--accent-soft)]">
                            <div className="font-mono text-xs uppercase tracking-[0.35em] text-[var(--muted)]">
                                author profile
                            </div>
                            <CardTitle className="mt-2 font-[var(--serif)] text-4xl">
                                {authorQuery.data.displayName}
                            </CardTitle>
                            <CardDescription className="font-mono">@{authorSlug}</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <p className="max-w-3xl text-[var(--muted)]">
                                {authorQuery.data.bio ||
                                    "The author has not added a profile description yet."}
                            </p>
                            {authorQuery.data.tags.length ? (
                                <div className="mt-5 flex flex-wrap gap-2">
                                    {authorQuery.data.tags.map((tag) => (
                                        <Badge className="rounded-full" key={tag}>
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            ) : null}
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden rounded-[32px]">
                        <CardHeader>
                            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                                <ShieldCheck className="size-4" />
                                access tiers
                            </div>
                            <CardTitle>Choose what you want to unlock</CardTitle>
                            <CardDescription>
                                Tiers combine subscriptions, token ownership, and NFT ownership.
                                Public content stays available without a wallet.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="bg-[linear-gradient(135deg,var(--surface)_0%,var(--surface-strong)_100%)]">
                            {policiesQuery.isLoading ? (
                                <LoadingMessage>Loading tiers...</LoadingMessage>
                            ) : !policiesQuery.data?.length ? (
                                <EmptyState
                                    description="This author has not published custom tiers yet."
                                    title="No access tiers yet"
                                />
                            ) : (
                                <div className="grid gap-4 lg:grid-cols-3">
                                    <PublicTierCard />
                                    {policiesQuery.data?.map((policy) => (
                                        <TierCard
                                            key={policy.id}
                                            onOpen={() => setSelectedTierId(policy.id)}
                                            policy={policy}
                                        />
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="rounded-[28px]">
                        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <CardTitle>Posts by {authorQuery.data.displayName}</CardTitle>
                            </div>
                            <Button asChild className="rounded-full" variant="outline">
                                <Link to="#projects">Projects</Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {postsQuery.isLoading ? (
                                <PostFeedSkeleton />
                            ) : postsQuery.isError ? (
                                <ErrorMessage>{postsQuery.error.message}</ErrorMessage>
                            ) : (
                                <PostFeed emptyLabel="No posts yet." posts={posts} />
                            )}
                            <div ref={postSentinelRef} />
                            {postsQuery.isLoadingMore ? (
                                <div className="mt-5">
                                    <PostFeedSkeleton count={1} />
                                </div>
                            ) : null}
                            <LoadMorePostsButton
                                hasMore={postsQuery.hasMore}
                                isLoadingMore={postsQuery.isLoadingMore}
                                onLoadMore={postsQuery.loadMore}
                            />
                        </CardContent>
                    </Card>

                    <Card className="rounded-[28px]" id="projects">
                        <CardHeader>
                            <CardTitle>Projects by {authorQuery.data.displayName}</CardTitle>
                            <CardDescription>
                                Structured spaces published by this author.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {projectsQuery.isLoading ? (
                                <LoadingMessage>Loading projects...</LoadingMessage>
                            ) : projectsQuery.isError ? (
                                <ErrorMessage>{projectsQuery.error.message}</ErrorMessage>
                            ) : (
                                <ProjectList
                                    emptyLabel="No projects yet."
                                    projects={projectsQuery.data}
                                />
                            )}
                        </CardContent>
                    </Card>

                    <TierDrawer
                        authorSlug={authorSlug}
                        onOpenChange={(open) => {
                            if (!open) {
                                setSelectedTierId(null)
                            }
                        }}
                        open={Boolean(selectedTier)}
                        tier={selectedTier}
                    />
                </>
            ) : null}
        </section>
    )
}
