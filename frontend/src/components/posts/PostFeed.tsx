import type { FeedPostDto, PostDto } from "@contracts/types/content"
import { Link } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/utils/cn"

type FeedPost = PostDto | FeedPostDto

interface PostFeedProps {
    emptyLabel: string
    isAuthorView?: boolean
    onArchive?: (post: PostDto) => void
    onDelete?: (post: PostDto) => void
    onEdit?: (post: PostDto) => void
    posts?: FeedPost[]
    showAuthor?: boolean
}

export function PostFeed({
    emptyLabel,
    isAuthorView = false,
    onArchive,
    onDelete,
    onEdit,
    posts = [],
    showAuthor = false,
}: PostFeedProps) {
    if (!posts.length) {
        return <p className="text-[var(--muted)]">{emptyLabel}</p>
    }

    return (
        <div className="grid gap-4">
            {posts.map((post) => (
                <PostCard
                    isAuthorView={isAuthorView}
                    key={post.id}
                    onArchive={onArchive}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    post={post}
                    showAuthor={showAuthor}
                />
            ))}
        </div>
    )
}

function PostCard({
    isAuthorView,
    onArchive,
    onDelete,
    onEdit,
    post,
    showAuthor,
}: {
    isAuthorView: boolean
    onArchive?: (post: PostDto) => void
    onDelete?: (post: PostDto) => void
    onEdit?: (post: PostDto) => void
    post: FeedPost
    showAuthor: boolean
}) {
    const author = "authorSlug" in post ? post : null
    const postLink = author ? `/authors/${author.authorSlug}/posts/${post.id}` : undefined

    return (
        <Card className="rounded-[28px] transition-colors hover:bg-[var(--accent-soft)]">
            <CardHeader className="gap-3">
                {showAuthor && author ? (
                    <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--muted)]">
                        <span>{author.authorDisplayName}</span>
                        <Link
                            className="font-mono underline-offset-4 hover:underline"
                            to={`/authors/${author.authorSlug}`}
                        >
                            @{author.authorSlug}
                        </Link>
                    </div>
                ) : null}
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <CardTitle>
                            {postLink ? (
                                <Link className="underline-offset-4 hover:underline" to={postLink}>
                                    {post.title}
                                </Link>
                            ) : (
                                post.title
                            )}
                        </CardTitle>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                            <Badge className="rounded-full">{post.status}</Badge>
                            <span className="text-xs text-[var(--muted)]">
                                {formatDate(post.publishedAt ?? post.createdAt)}
                            </span>
                        </div>
                    </div>
                    {isAuthorView ? (
                        <div className="flex flex-wrap gap-2">
                            <Button
                                className="rounded-full"
                                onClick={() => onEdit?.(post)}
                                size="sm"
                                type="button"
                                variant="outline"
                            >
                                Edit
                            </Button>
                            <Button
                                className="rounded-full"
                                onClick={() => onArchive?.(post)}
                                size="sm"
                                type="button"
                                variant="outline"
                            >
                                Archive
                            </Button>
                            <Button
                                className="rounded-full"
                                onClick={() => onDelete?.(post)}
                                size="sm"
                                type="button"
                                variant="destructive"
                            >
                                Delete
                            </Button>
                        </div>
                    ) : null}
                </div>
            </CardHeader>
            <CardContent>
                <p className={cn("whitespace-pre-wrap text-sm leading-6 text-[var(--muted)]")}>
                    {post.content}
                </p>
            </CardContent>
        </Card>
    )
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat("en", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(new Date(value))
}
