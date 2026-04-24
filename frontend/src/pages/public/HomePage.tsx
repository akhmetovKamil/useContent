import { ArrowUpRight, Search, UsersRound } from "lucide-react"
import { useDeferredValue, useState } from "react"
import { Link } from "react-router-dom"

import { HomeHero } from "@/components/home-page/HomeHero"
import { PostFeed } from "@/components/posts/PostFeed"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAuthorsQuery } from "@/queries/authors"
import { flattenFeedPages, useExploreFeedPostsQuery } from "@/queries/posts"
import { useMyAuthorProfileQuery } from "@/queries/profile"
import { useAuthStore } from "@/stores/auth-store"

export function HomePage() {
    const token = useAuthStore((state) => state.token)
    const [authorSearch, setAuthorSearch] = useState("")
    const deferredAuthorSearch = useDeferredValue(authorSearch)
    const authorQuery = useMyAuthorProfileQuery(Boolean(token))
    const authorsQuery = useAuthorsQuery(Boolean(token), deferredAuthorSearch.trim())
    const feedQuery = useExploreFeedPostsQuery(true)
    const feedPosts = flattenFeedPages(feedQuery.data)

    return (
        <div className="grid gap-6">
            <HomeHero authorSlug={authorQuery.data?.slug} isSignedIn={Boolean(token)} />
            <Card className="rounded-[32px]">
                <CardHeader>
                    <div className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                        live feed
                    </div>
                    <CardTitle className="mt-3">Latest posts</CardTitle>
                </CardHeader>
                <CardContent>
                    {feedQuery.isLoading ? (
                        <p className="text-sm text-[var(--muted)]">Loading feed...</p>
                    ) : feedQuery.isError ? (
                        <p className="text-sm text-rose-600">{feedQuery.error.message}</p>
                    ) : (
                        <PostFeed
                            emptyLabel="No public posts yet."
                            posts={feedPosts}
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
