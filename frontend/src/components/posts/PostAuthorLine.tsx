import { Link } from "react-router-dom"

import { ProfileAvatar } from "@/components/common/ProfileAvatar"
import type { FeedPost } from "@/components/posts/types"

export function PostAuthorLine({ post }: { post: Extract<FeedPost, { authorSlug: string }> }) {
    return (
        <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-[var(--muted)]">
            <ProfileAvatar
                avatarFileId={post.authorAvatarFileId}
                className="size-8"
                label={post.authorDisplayName || post.authorSlug}
            />
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
