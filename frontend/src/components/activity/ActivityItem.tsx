import type { ActivityDto } from "@shared/types/posts"
import { shortenWalletAddress } from "@shared/utils/web3"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { getActivityIcon } from "@/utils/activity"
import { formatPostDate } from "@/utils/date"

export function ActivityItem({ activity }: { activity: ActivityDto }) {
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
