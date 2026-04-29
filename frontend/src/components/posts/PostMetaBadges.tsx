import type { FeedPost } from "@/components/posts/types"
import { Badge } from "@/components/ui/badge"
import { formatPostDate } from "@/utils/date"

export function PostMetaBadges({ post }: { post: FeedPost }) {
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
