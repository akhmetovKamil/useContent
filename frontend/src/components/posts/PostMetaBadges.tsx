import type { FeedPost } from "@/components/posts/types"
import { Badge } from "@/components/ui/badge"

export function PostMetaBadges({ isAuthorView = false, post }: { isAuthorView?: boolean; post: FeedPost }) {
    return (
        <div className="mt-2 flex flex-wrap items-center gap-2">
            {isAuthorView ? <Badge className="rounded-full">{post.status}</Badge> : null}
            {"promotion" in post && post.promotion?.active ? (
                <Badge className="rounded-full" variant="warning">
                    Promoted
                </Badge>
            ) : null}
        </div>
    )
}
