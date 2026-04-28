import type { AuthorCatalogItemDto } from "@shared/types/content"
import { ArrowUpRight, Search, UsersRound } from "lucide-react"
import { Link } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

interface AuthorDiscoverySectionProps {
    authors: AuthorCatalogItemDto[]
    search: string
    deferredSearch: string
    authorSlug?: string
    isLoading: boolean
    isError: boolean
    errorMessage?: string
    onSearchChange: (value: string) => void
}

export function AuthorDiscoverySection({
    authors,
    search,
    deferredSearch,
    authorSlug,
    isLoading,
    isError,
    errorMessage,
    onSearchChange,
}: AuthorDiscoverySectionProps) {
    return (
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
                        onChange={(event) => onSearchChange(event.target.value)}
                        placeholder="Search by name, tag, or username"
                        value={search}
                    />
                </label>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <p className="text-sm text-[var(--muted)]">Loading authors...</p>
                ) : isError ? (
                    <p className="text-sm text-rose-600">{errorMessage}</p>
                ) : authors.length ? (
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {authors.map((author) => (
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
                            {deferredSearch
                                ? "No authors match this search yet."
                                : "No authors yet. The first creator space will appear here."}
                        </p>
                        {authorSlug ? (
                            <Button asChild className="mt-4 rounded-full" variant="outline">
                                <Link to={`/authors/${authorSlug}`}>Open your author profile</Link>
                            </Button>
                        ) : null}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
