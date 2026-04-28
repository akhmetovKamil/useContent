import { Link } from "react-router-dom"

import type { FeedPost } from "@/components/posts/types"
import { Badge } from "@/components/ui/badge"
import { formatPostDate } from "@/utils/date"

export function AuthorLine({ post }: { post: Extract<FeedPost, { authorSlug: string }> }) {
    return (
        <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-[var(--muted)]">
            <span className="font-medium text-[var(--foreground)]">{post.authorDisplayName}</span>
            <Link
                className="font-mono underline-offset-4 hover:underline"
                to={`/authors/${post.authorSlug}`}
            >
                @{post.authorSlug}
            </Link>
            {post.feedReason ? <span>· {post.feedReason}</span> : null}
        </div>
    )
}

export function PostMeta({ post }: { post: FeedPost }) {
    return (
        <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge className="rounded-full">{post.status}</Badge>
            {"accessLabel" in post && post.accessLabel ? (
                <Badge className="rounded-full" variant={post.hasAccess ? "success" : "warning"}>
                    {post.accessLabel}
                </Badge>
            ) : null}
            {"promotion" in post && post.promotion?.active ? (
                <Badge className="rounded-full" variant="warning">
                    Promoted
                </Badge>
            ) : null}
            <span className="text-xs text-[var(--muted)]">
                {formatPostDate(post.publishedAt ?? post.createdAt)}
            </span>
        </div>
    )
}
