import { Link } from "react-router-dom"

import { AuthorActions, AuthorMetrics } from "@/components/author-workspace/AuthorDashboardCards"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eyebrow, PageSection, PageTitle } from "@/components/ui/page"
import { useMyPostsQuery } from "@/queries/posts"
import { useMyAuthorProfileQuery } from "@/queries/profile"
import { useMyProjectsQuery } from "@/queries/projects"
import { useMySubscriptionPlanQuery } from "@/queries/subscription-plans"
import { useAuthStore } from "@/stores/auth-store"
import { isApiNotFoundError } from "@/utils/api/errors"

export function AuthorWorkspacePage() {
    const token = useAuthStore((state) => state.token)
    const authorQuery = useMyAuthorProfileQuery(Boolean(token))
    const postsQuery = useMyPostsQuery(Boolean(token))
    const projectsQuery = useMyProjectsQuery(Boolean(token))
    const planQuery = useMySubscriptionPlanQuery(Boolean(token))
    const needsAuthorProfile = token && isApiNotFoundError(authorQuery.error)

    return (
        <section className="grid gap-6">
            <PageSection>
                <Eyebrow>author workspace</Eyebrow>
                <PageTitle>Create, publish, and manage gated content.</PageTitle>
                {!token ? (
                    <p className="mt-4 max-w-2xl text-[var(--muted)]">
                        Connect and sign with a wallet to open the author workspace.
                    </p>
                ) : needsAuthorProfile ? (
                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle>Become an author</CardTitle>
                            <CardDescription>
                                Your wallet is already a reader account. Create an author profile to
                                publish posts, projects, and subscription rules.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button asChild className="rounded-full">
                                <Link to="/me/author">Create author profile</Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : authorQuery.data ? (
                    <AuthorMetrics
                        metrics={[
                            { label: "Author", value: `@${authorQuery.data.slug}` },
                            { label: "Posts", value: String(postsQuery.data?.length ?? 0) },
                            { label: "Projects", value: String(projectsQuery.data?.length ?? 0) },
                            {
                                label: "Plan",
                                value: planQuery.data?.active ? "Active" : "Not configured",
                            },
                        ]}
                    />
                ) : (
                    <p className="mt-4 text-[var(--muted)]">Loading author workspace...</p>
                )}
            </PageSection>

            {authorQuery.data ? (
                <AuthorActions
                    actions={[
                        {
                            description: "Edit public identity and default access policy.",
                            label: "Author profile",
                            to: "/me/author",
                        },
                        {
                            description: "Create posts, publish drafts, and delete old content.",
                            label: "Posts",
                            to: "/me/posts",
                        },
                        {
                            description: "Create project spaces and manage visibility.",
                            label: "Projects",
                            to: "/me/projects",
                        },
                        {
                            description: "Configure the main crypto subscription plan.",
                            label: "Subscription",
                            to: "/me/subscription-plan",
                        },
                    ]}
                />
            ) : null}
        </section>
    )
}
