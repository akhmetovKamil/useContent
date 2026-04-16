import { Link } from "react-router-dom"

import { AuthorMetrics } from "@/components/author-workspace/AuthorDashboardCards"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageSection, PageTitle } from "@/components/ui/page"
import { useMyPostsQuery } from "@/queries/posts"
import { useMyAuthorProfileQuery, useMyAuthorSubscribersQuery } from "@/queries/profile"
import { useMyProjectsQuery } from "@/queries/projects"
import { useAuthStore } from "@/stores/auth-store"
import { isApiNotFoundError } from "@/utils/api/errors"

export function AuthorWorkspacePage() {
    const token = useAuthStore((state) => state.token)
    const authorQuery = useMyAuthorProfileQuery(Boolean(token))
    const postsQuery = useMyPostsQuery(Boolean(token))
    const projectsQuery = useMyProjectsQuery(Boolean(token))
    const subscribersQuery = useMyAuthorSubscribersQuery(Boolean(token))
    const subscriberCount = new Set(
        (subscribersQuery.data ?? []).map((subscriber) => subscriber.subscriberWallet)
    ).size
    const needsAuthorProfile = token && isApiNotFoundError(authorQuery.error)

    return (
        <section className="grid gap-6">
            <PageSection>
                <PageTitle>Create, publish, and manage paid content.</PageTitle>
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
                            {
                                description: "Edit public identity and default access policy.",
                                label: "Author",
                                to: "/me/author",
                                value: `@${authorQuery.data.slug}`,
                            },
                            {
                                description:
                                    "Create posts, publish drafts, and delete old content.",
                                label: "Posts",
                                to: "/me/posts",
                                value: String(postsQuery.data?.length ?? 0),
                            },
                            {
                                description: "Create project spaces and manage visibility.",
                                label: "Projects",
                                to: "/me/projects",
                                value: String(projectsQuery.data?.length ?? 0),
                            },
                            {
                                description: "Review subscribers and their access policies.",
                                label: "Subscribers",
                                to: "/me/subscribers",
                                value: String(subscriberCount),
                            },
                        ]}
                    />
                ) : (
                    <p className="mt-4 text-[var(--muted)]">Loading author workspace...</p>
                )}
            </PageSection>
        </section>
    )
}
