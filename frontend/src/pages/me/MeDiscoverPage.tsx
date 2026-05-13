import type { AuthorCatalogItemDto } from "@shared/types/profile"
import { ArrowUpRight, Sparkles } from "lucide-react"
import { Link } from "react-router-dom"

import { ProfileAvatar } from "@/components/common/ProfileAvatar"
import { Badge } from "@/components/ui/badge"
import { DiaTextReveal } from "@/components/ui/dia-text-reveal"
import { Marquee } from "@/components/ui/marquee"
import { useAuthorsQuery } from "@/queries/authors"

export function MeDiscoverPage() {
    const authorsQuery = useAuthorsQuery(true)
    const authors = authorsQuery.data ?? []
    const firstRow = authors
    const secondRow = [...authors].reverse()

    return (
        <section className="relative -mx-5 -my-6 min-h-[calc(100vh-2rem)] min-w-0 overflow-hidden px-5 py-14 md:-mx-8 md:-my-8 md:px-8 md:py-20">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,var(--accent-soft),transparent_30%),radial-gradient(circle_at_82%_12%,var(--secondary),transparent_24%)] opacity-80" />
            <div className="relative mx-auto grid max-w-6xl gap-12">
                <div className="grid min-h-[360px] place-items-center text-center md:min-h-[440px]">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2 font-mono text-xs uppercase tracking-[0.28em] text-[var(--muted)] shadow-[var(--shadow)]">
                            <Sparkles className="size-4 text-[var(--accent)]" />
                            reader home
                        </div>
                        <h1 className="mt-7 font-[var(--serif)] text-5xl leading-none tracking-normal text-[var(--foreground)] md:text-7xl lg:text-8xl">
                            <DiaTextReveal
                                colors={[
                                    "var(--accent)",
                                    "var(--dock-highlight,var(--secondary))",
                                    "var(--foreground)",
                                ]}
                                duration={1.8}
                                text="USE CONTENT"
                            />
                        </h1>
                        <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-[var(--muted)] md:text-lg">
                            A moving reader home for discovering authors, tiers, and new creator
                            spaces.
                        </p>
                    </div>
                </div>

                <div className="grid gap-5">
                    {authorsQuery.isLoading ? (
                        <AuthorMarqueeSkeleton />
                    ) : authorsQuery.isError ? (
                        <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5 text-sm text-rose-600 shadow-[var(--shadow)]">
                            {authorsQuery.error.message}
                        </div>
                    ) : authors.length ? (
                        <>
                            <AuthorMarqueeRow authors={firstRow} />
                            <AuthorMarqueeRow authors={secondRow} reverse />
                        </>
                    ) : (
                        <div className="rounded-lg border border-dashed border-[var(--line)] bg-[var(--surface)] p-6 text-sm text-[var(--muted)] shadow-[var(--shadow)]">
                            No authors yet. The first creator space will appear here.
                        </div>
                    )}
                </div>
            </div>
        </section>
    )
}

function AuthorMarqueeRow({
    authors,
    reverse = false,
}: {
    authors: AuthorCatalogItemDto[]
    reverse?: boolean
}) {
    return (
        <Marquee
            className="[--duration:38s] [--gap:1rem] [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]"
            pauseOnHover
            repeat={authors.length > 3 ? 3 : 5}
            reverse={reverse}
        >
            {authors.map((author) => (
                <AuthorRailCard author={author} key={author.id} />
            ))}
        </Marquee>
    )
}

function AuthorRailCard({ author }: { author: AuthorCatalogItemDto }) {
    return (
        <Link
            className="group w-[280px] shrink-0 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[var(--shadow)] transition hover:-translate-y-0.5 hover:bg-[var(--accent-soft)] sm:w-[340px]"
            to={`/authors/${author.slug}`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                    <ProfileAvatar
                        avatarFileId={author.avatarFileId}
                        className="size-12"
                        label={author.displayName || author.slug}
                    />
                    <div className="min-w-0">
                        <div className="truncate text-lg font-medium text-[var(--foreground)]">
                            {author.displayName}
                        </div>
                        <div className="mt-1 truncate font-mono text-xs text-[var(--muted)]">
                            @{author.slug}
                        </div>
                    </div>
                </div>
                <ArrowUpRight className="size-5 text-[var(--muted)] transition group-hover:text-[var(--foreground)]" />
            </div>
            <p className="mt-4 line-clamp-2 min-h-11 text-sm leading-6 text-[var(--muted)]">
                {author.bio || "No profile description yet."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
                <Badge>{author.postsCount} posts</Badge>
                <Badge>{author.subscriptionPlansCount} tiers</Badge>
                {author.tags.slice(0, 1).map((tag) => (
                    <Badge key={tag} variant="secondary">
                        {tag}
                    </Badge>
                ))}
            </div>
        </Link>
    )
}

function AuthorMarqueeSkeleton() {
    return (
        <div className="grid gap-5">
            {[0, 1].map((row) => (
                <div className="flex gap-4 overflow-hidden" key={row}>
                    {[0, 1, 2].map((item) => (
                        <div
                            className="h-48 w-[280px] shrink-0 animate-pulse rounded-lg border border-[var(--line)] bg-[var(--surface)] sm:w-[340px]"
                            key={item}
                        />
                    ))}
                </div>
            ))}
        </div>
    )
}
