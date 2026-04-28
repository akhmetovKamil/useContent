import { ActivityItem } from "@/components/activity/ActivityItem"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { PageSection, PageTitle } from "@/components/ui/page"
import { useMyActivityQuery } from "@/queries/activity"
import { useAuthStore } from "@/stores/auth-store"

export function MeActivityPage() {
    const token = useAuthStore((state) => state.token)
    const activityQuery = useMyActivityQuery(Boolean(token))
    const activities = activityQuery.items

    return (
        <section className="grid gap-6">
            <PageSection>
                <PageTitle>Activity</PageTitle>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                    Lightweight updates from comments, likes, subscriptions and new posts from
                    authors you follow. The list refreshes automatically while the page is open.
                </p>
            </PageSection>

            <Card className="rounded-[32px]">
                <CardHeader>
                    <CardTitle>Recent events</CardTitle>
                </CardHeader>
                <CardContent>
                    {activityQuery.isLoading ? (
                        <div className="grid gap-3">
                            {Array.from({ length: 4 }).map((_, index) => (
                                <div
                                    className="h-20 animate-pulse rounded-2xl bg-[var(--surface-strong)]"
                                    key={index}
                                />
                            ))}
                        </div>
                    ) : activityQuery.isError ? (
                        <p className="text-sm text-rose-600">{activityQuery.error.message}</p>
                    ) : activities.length ? (
                        <div className="grid gap-3">
                            {activities.map((activity) => (
                                <ActivityItem activity={activity} key={activity.id} />
                            ))}
                            {activityQuery.hasMore ? (
                                <Button
                                    className="mx-auto mt-2 rounded-full"
                                    disabled={activityQuery.isLoadingMore}
                                    onClick={activityQuery.loadMore}
                                    variant="outline"
                                >
                                    {activityQuery.isLoadingMore ? "Loading..." : "Load more"}
                                </Button>
                            ) : null}
                        </div>
                    ) : (
                        <EmptyState
                            description="Likes, comments, subscriptions and new posts from followed authors will appear here."
                            title="No activity yet"
                        />
                    )}
                </CardContent>
            </Card>
        </section>
    )
}
