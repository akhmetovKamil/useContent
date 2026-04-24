import { PostCard } from "@/components/posts/PostCard"
import type { AuthorPostActions, FeedPost } from "@/components/posts/types"

interface PostFeedProps extends AuthorPostActions {
    emptyLabel: string
    isAuthorView?: boolean
    posts?: FeedPost[]
    showAuthor?: boolean
}

export function PostFeed({
    emptyLabel,
    isAuthorView = false,
    onArchive,
    onDelete,
    onEdit,
    onPublish,
    onUnarchive,
    posts = [],
    showAuthor = false,
}: PostFeedProps) {
    if (!posts.length) {
        return <p className="text-[var(--muted)]">{emptyLabel}</p>
    }

    return (
        <div className="mx-auto grid w-full max-w-3xl gap-4">
            {posts.map((post) => (
                <PostCard
                    isAuthorView={isAuthorView}
                    key={post.id}
                    onArchive={onArchive}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    onPublish={onPublish}
                    onUnarchive={onUnarchive}
                    post={post}
                    showAuthor={showAuthor}
                />
            ))}
        </div>
    )
}
