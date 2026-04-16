import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Globe } from "@/components/ui/globe"
import { Eyebrow, PageSection, PageTitle } from "@/components/ui/page"
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
            <Globe />
            <PageSection className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
                <div>
                    <Eyebrow>workspace</Eyebrow>
                    <PageTitle className="max-w-3xl md:text-6xl">
                        Content, access rules, and subscriptions in one place.
                    </PageTitle>
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
            </PageSection>

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
        <Button asChild className="justify-start rounded-full" variant="outline">
            <Link onClick={onClick} to={to}>
                {label}
            </Link>
        </Button>
    )
}

function MetricCard({ label, value }: { label: string; value: string }) {
    return (
        <Card>
            <CardHeader>
                <Eyebrow className="tracking-[0.3em]">{label}</Eyebrow>
                <CardTitle className="text-2xl">{value}</CardTitle>
            </CardHeader>
        </Card>
    )
}
