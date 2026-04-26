import type { ActivityDto } from "@shared/types/content"
import { shortenWalletAddress } from "@shared/utils"
import { Bell, Heart, MessageCircle, ReceiptText, Send } from "lucide-react"
import { Link } from "react-router-dom"

import { formatPostDate } from "@/components/posts/date"
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

function ActivityItem({ activity }: { activity: ActivityDto }) {
    const Icon = getActivityIcon(activity.type)
    const postHref =
        activity.authorSlug && activity.postId
            ? `/authors/${activity.authorSlug}/posts/${activity.postId}`
            : null
    const authorHref = activity.authorSlug ? `/authors/${activity.authorSlug}` : null

    return (
        <article className="flex gap-4 rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] p-4">
            <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
                <Icon className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-[var(--foreground)]">
                    {activity.message}
                </div>
                <div className="mt-1 flex flex-wrap gap-2 text-xs text-[var(--muted)]">
                    <span>{formatPostDate(activity.createdAt)}</span>
                    {activity.authorDisplayName && authorHref ? (
                        <Link className="underline-offset-4 hover:underline" to={authorHref}>
                            {activity.authorDisplayName}
                        </Link>
                    ) : null}
                    {activity.actorWallet ? (
                        <span title={activity.actorWallet}>
                            {shortenWalletAddress(activity.actorWallet)}
                        </span>
                    ) : null}
                </div>
                {postHref && activity.postTitle ? (
                    <Button asChild className="mt-3 rounded-full" size="sm" variant="outline">
                        <Link to={postHref}>Open post</Link>
                    </Button>
                ) : authorHref ? (
                    <Button asChild className="mt-3 rounded-full" size="sm" variant="outline">
                        <Link to={authorHref}>Open author</Link>
                    </Button>
                ) : null}
            </div>
        </article>
    )
}

function getActivityIcon(type: ActivityDto["type"]) {
    if (type === "post_liked") {
        return Heart
    }
    if (type === "post_commented") {
        return MessageCircle
    }
    if (type === "new_subscription") {
        return ReceiptText
    }
    if (type === "new_post") {
        return Send
    }
    return Bell
}
