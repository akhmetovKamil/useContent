import { Link } from "react-router-dom"

import { useMyPostsQuery } from "@/queries/posts"
import { useMeQuery, useMyAuthorProfileQuery } from "@/queries/profile"
import { useMyProjectsQuery } from "@/queries/projects"
import { useAuthStore } from "@/shared/session/auth-store"
import { useWorkspaceStore } from "@/shared/session/workspace-store"

export function HomePage() {
    const token = useAuthStore((state) => state.token)
    const setMode = useWorkspaceStore((state) => state.setMode)
    const meQuery = useMeQuery(Boolean(token))
    const authorQuery = useMyAuthorProfileQuery(Boolean(token))
    const postsQuery = useMyPostsQuery(Boolean(token))
    const projectsQuery = useMyProjectsQuery(Boolean(token))

    return (
        <div className="grid gap-6">
            <section className="grid gap-6 rounded-[28px] border border-[var(--line)] bg-[var(--surface-strong)] p-6 md:grid-cols-[1.2fr_0.8fr] md:p-8">
                <div>
                    <div className="font-mono text-xs uppercase tracking-[0.35em] text-[var(--muted)]">
                        workspace
                    </div>
                    <h1 className="mt-4 max-w-3xl font-[var(--serif)] text-4xl leading-none text-[var(--foreground)] md:text-6xl">
                        Content, access rules, and subscriptions in one place.
                    </h1>
                    <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted)] md:text-lg">
                        Create an author profile, configure a subscription plan, publish posts and
                        project spaces, then test gated reading from public author pages.
                    </p>
                </div>

                <div className="grid gap-3 self-end">
                    <ActionLink label="Open profile" to="/me" />
                    <ActionLink
                        label={authorQuery.data ? "Open author workspace" : "Become an author"}
                        onClick={() => setMode("author")}
                        to="/author"
                    />
                    {authorQuery.data ? (
                        <ActionLink
                            label="View public page"
                            to={`/authors/${authorQuery.data.slug}`}
                        />
                    ) : null}
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-4">
                <MetricCard label="Wallet session" value={token ? "Signed in" : "Not signed in"} />
                <MetricCard label="Profile" value={meQuery.data?.displayName ?? "No profile"} />
                <MetricCard label="Posts" value={String(postsQuery.data?.length ?? 0)} />
                <MetricCard label="Projects" value={String(projectsQuery.data?.length ?? 0)} />
            </section>
        </div>
    )
}

function ActionLink({ label, onClick, to }: { label: string; onClick?: () => void; to: string }) {
    return (
        <Link
            className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)] transition-colors hover:bg-[var(--accent-soft)]"
            onClick={onClick}
            to={to}
        >
            {label}
        </Link>
    )
}

function MetricCard({ label, value }: { label: string; value: string }) {
    return (
        <article className="rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-5">
            <div className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">{label}</div>
            <div className="mt-3 text-2xl text-[var(--foreground)]">{value}</div>
        </article>
    )
}
