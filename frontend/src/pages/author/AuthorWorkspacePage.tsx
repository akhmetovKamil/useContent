import { Link } from "react-router-dom"

import { isApiNotFoundError } from "@/lib/api/errors"
import { useMyPostsQuery } from "@/queries/posts"
import { useMyAuthorProfileQuery } from "@/queries/profile"
import { useMyProjectsQuery } from "@/queries/projects"
import { useMySubscriptionPlanQuery } from "@/queries/subscription-plans"
import { useAuthStore } from "@/shared/session/auth-store"

export function AuthorWorkspacePage() {
    const token = useAuthStore((state) => state.token)
    const authorQuery = useMyAuthorProfileQuery(Boolean(token))
    const postsQuery = useMyPostsQuery(Boolean(token))
    const projectsQuery = useMyProjectsQuery(Boolean(token))
    const planQuery = useMySubscriptionPlanQuery(Boolean(token))
    const needsAuthorProfile = token && isApiNotFoundError(authorQuery.error)

    return (
        <section className="grid gap-6">
            <div className="rounded-[28px] border border-[var(--line)] bg-[var(--surface-strong)] p-6 md:p-8">
                <div className="font-mono text-xs uppercase tracking-[0.35em] text-[var(--muted)]">
                    author workspace
                </div>
                <h1 className="mt-3 font-[var(--serif)] text-4xl leading-tight text-[var(--foreground)] md:text-5xl">
                    Create, publish, and manage gated content.
                </h1>
                {!token ? (
                    <p className="mt-4 max-w-2xl text-[var(--muted)]">
                        Connect and sign with a wallet to open the author workspace.
                    </p>
                ) : needsAuthorProfile ? (
                    <div className="mt-6 grid gap-4 rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-5">
                        <div className="text-xl text-[var(--foreground)]">Become an author</div>
                        <p className="text-sm leading-6 text-[var(--muted)]">
                            Your wallet is already a reader account. Create an author profile to
                            publish posts, projects, and subscription rules.
                        </p>
                        <Link
                            className="w-fit rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent-foreground)]"
                            to="/me/author"
                        >
                            Create author profile
                        </Link>
                    </div>
                ) : authorQuery.data ? (
                    <div className="mt-6 grid gap-4 md:grid-cols-4">
                        <Metric label="Author" value={`@${authorQuery.data.slug}`} />
                        <Metric label="Posts" value={String(postsQuery.data?.length ?? 0)} />
                        <Metric label="Projects" value={String(projectsQuery.data?.length ?? 0)} />
                        <Metric
                            label="Plan"
                            value={planQuery.data?.active ? "Active" : "Not configured"}
                        />
                    </div>
                ) : (
                    <p className="mt-4 text-[var(--muted)]">Loading author workspace...</p>
                )}
            </div>

            {authorQuery.data ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <ActionCard
                        description="Edit public identity and default access policy."
                        label="Author profile"
                        to="/me/author"
                    />
                    <ActionCard
                        description="Create posts, publish drafts, and delete old content."
                        label="Posts"
                        to="/me/posts"
                    />
                    <ActionCard
                        description="Create project spaces and manage visibility."
                        label="Projects"
                        to="/me/projects"
                    />
                    <ActionCard
                        description="Configure the main crypto subscription plan."
                        label="Subscription"
                        to="/me/subscription-plan"
                    />
                </div>
            ) : null}
        </section>
    )
}

function Metric({ label, value }: { label: string; value: string }) {
    return (
        <article className="rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-5">
            <div className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">{label}</div>
            <div className="mt-3 truncate text-2xl text-[var(--foreground)]">{value}</div>
        </article>
    )
}

function ActionCard({
    description,
    label,
    to,
}: {
    description: string
    label: string
    to: string
}) {
    return (
        <Link
            className="rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-5 transition-colors hover:bg-[var(--accent-soft)]"
            to={to}
        >
            <div className="text-xl text-[var(--foreground)]">{label}</div>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{description}</p>
        </Link>
    )
}
