import type { FeedPostDto, PostDto } from "@shared/types/content"
import { Eye, Heart, LockKeyhole, MessageCircle } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    useCreatePostCommentMutation,
    useDownloadAuthorPostAttachmentMutation,
    useDownloadMyPostAttachmentMutation,
    usePostCommentsQuery,
    useTogglePostLikeMutation,
} from "@/queries/posts"
import { useAuthStore } from "@/stores/auth-store"
import { cn } from "@/utils/cn"

type FeedPost = PostDto | FeedPostDto

interface PostFeedProps {
    emptyLabel: string
    isAuthorView?: boolean
    onArchive?: (post: PostDto) => void
    onDelete?: (post: PostDto) => void
    onEdit?: (post: PostDto) => void
    onPublish?: (post: PostDto) => void
    onUnarchive?: (post: PostDto) => void
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
        <div className="grid gap-4">
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

function PostCard({
    isAuthorView,
    onArchive,
    onDelete,
    onEdit,
    onPublish,
    onUnarchive,
    post,
    showAuthor,
}: {
    isAuthorView: boolean
    onArchive?: (post: PostDto) => void
    onDelete?: (post: PostDto) => void
    onEdit?: (post: PostDto) => void
    onPublish?: (post: PostDto) => void
    onUnarchive?: (post: PostDto) => void
    post: FeedPost
    showAuthor: boolean
}) {
    const token = useAuthStore((state) => state.token)
    const [commentsOpen, setCommentsOpen] = useState(false)
    const [comment, setComment] = useState("")
    const author = "authorSlug" in post ? post : null
    const postLink = author ? `/authors/${author.authorSlug}/posts/${post.id}` : undefined
    const hasAccess = !("hasAccess" in post) || post.hasAccess
    const attachments = post.attachments ?? []
    const linkedProjectIds = post.linkedProjectIds ?? []
    const commentsQuery = usePostCommentsQuery(
        author?.authorSlug ?? "",
        post.id,
        Boolean(author) && commentsOpen && hasAccess
    )
    const likeMutation = useTogglePostLikeMutation(author?.authorSlug ?? "", post.id)
    const commentMutation = useCreatePostCommentMutation(author?.authorSlug ?? "", post.id)
    const downloadMyAttachmentMutation = useDownloadMyPostAttachmentMutation()
    const downloadAuthorAttachmentMutation = useDownloadAuthorPostAttachmentMutation(
        author?.authorSlug ?? "",
        post.id
    )

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
                            {"accessLabel" in post && post.accessLabel ? (
                                <Badge
                                    className="rounded-full"
                                    variant={post.hasAccess ? "success" : "warning"}
                                >
                                    {post.accessLabel}
                                </Badge>
                            ) : null}
                            <span className="text-xs text-[var(--muted)]">
                                {formatDate(post.publishedAt ?? post.createdAt)}
                            </span>
                        </div>
                    </div>
                    {isAuthorView ? (
                        <div className="flex flex-wrap gap-2">
                            {post.status === "draft" ? (
                                <Button
                                    className="rounded-full"
                                    onClick={() => onPublish?.(post)}
                                    size="sm"
                                    type="button"
                                    variant="outline"
                                >
                                    Publish
                                </Button>
                            ) : null}
                            {post.status === "archived" ? (
                                <Button
                                    className="rounded-full"
                                    onClick={() => onUnarchive?.(post)}
                                    size="sm"
                                    type="button"
                                    variant="outline"
                                >
                                    Unarchive
                                </Button>
                            ) : null}
                            <Button
                                className="rounded-full"
                                onClick={() => onEdit?.(post)}
                                size="sm"
                                type="button"
                                variant="outline"
                            >
                                Edit
                            </Button>
                            {post.status !== "archived" ? (
                                <Button
                                    className="rounded-full"
                                    onClick={() => onArchive?.(post)}
                                    size="sm"
                                    type="button"
                                    variant="outline"
                                >
                                    Archive
                                </Button>
                            ) : null}
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
                {hasAccess ? (
                    <>
                        <p
                            className={cn(
                                "whitespace-pre-wrap text-sm leading-6 text-[var(--muted)]"
                            )}
                        >
                            {post.content}
                        </p>
                        <div className="mt-5 flex flex-wrap items-center gap-2">
                            {author ? (
                                <Button
                                    className="rounded-full"
                                    disabled={!token || likeMutation.isPending}
                                    onClick={() => void likeMutation.mutateAsync()}
                                    size="sm"
                                    type="button"
                                    variant={post.likedByMe ? "default" : "outline"}
                                >
                                    <Heart
                                        className={cn(
                                            "size-4",
                                            post.likedByMe ? "fill-current" : ""
                                        )}
                                    />
                                    {post.likesCount}
                                </Button>
                            ) : (
                                <Badge className="rounded-full">{post.likesCount} likes</Badge>
                            )}
                            <Button
                                className="rounded-full"
                                disabled={!author}
                                onClick={() => setCommentsOpen((value) => !value)}
                                size="sm"
                                type="button"
                                variant="outline"
                            >
                                <MessageCircle className="size-4" />
                                {post.commentsCount}
                            </Button>
                            <Badge className="rounded-full border border-[var(--line)] bg-transparent">
                                <Eye className="size-3.5" />
                                {post.viewsCount} views
                            </Badge>
                        </div>

                        {attachments.length ? (
                            <div className="mt-4 flex flex-wrap gap-2">
                                {attachments.map((attachment) => (
                                    <Button
                                        className="rounded-full"
                                        key={attachment.id}
                                        onClick={() => {
                                            if (isAuthorView) {
                                                void downloadMyAttachmentMutation.mutateAsync({
                                                    attachmentId: attachment.id,
                                                    fileName: attachment.fileName,
                                                    postId: post.id,
                                                })
                                                return
                                            }
                                            if (author) {
                                                void downloadAuthorAttachmentMutation.mutateAsync({
                                                    attachmentId: attachment.id,
                                                    fileName: attachment.fileName,
                                                })
                                            }
                                        }}
                                        size="sm"
                                        type="button"
                                        variant="outline"
                                    >
                                        {attachment.kind}: {attachment.fileName}
                                    </Button>
                                ))}
                            </div>
                        ) : null}

                        {author && linkedProjectIds.length ? (
                            <div className="mt-4 flex flex-wrap gap-2">
                                {linkedProjectIds.map((projectId) => (
                                    <Button
                                        asChild
                                        className="rounded-full"
                                        key={projectId}
                                        size="sm"
                                        variant="outline"
                                    >
                                        <Link
                                            to={
                                                isAuthorView
                                                    ? "/me/projects"
                                                    : `/authors/${author.authorSlug}/projects/${projectId}`
                                            }
                                        >
                                            Attached project
                                        </Link>
                                    </Button>
                                ))}
                            </div>
                        ) : null}

                        {author && commentsOpen ? (
                            <div className="mt-5 rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-4">
                                {commentsQuery.isLoading ? (
                                    <p className="text-sm text-[var(--muted)]">
                                        Loading comments...
                                    </p>
                                ) : commentsQuery.isError ? (
                                    <p className="text-sm text-rose-600">
                                        Failed to load comments: {commentsQuery.error.message}
                                    </p>
                                ) : commentsQuery.data?.length ? (
                                    <div className="grid gap-3">
                                        {commentsQuery.data.map((item) => (
                                            <div key={item.id}>
                                                <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                                                    <span className="font-medium text-[var(--foreground)]">
                                                        {item.displayName}
                                                    </span>
                                                    <span>{formatDate(item.createdAt)}</span>
                                                </div>
                                                <p className="mt-1 text-sm leading-6 text-[var(--foreground)]">
                                                    {item.content}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-[var(--muted)]">No comments yet.</p>
                                )}

                                {token ? (
                                    <form
                                        className="mt-4 flex gap-2"
                                        onSubmit={(event) => {
                                            event.preventDefault()
                                            if (!comment.trim()) {
                                                return
                                            }
                                            void commentMutation
                                                .mutateAsync({ content: comment })
                                                .then(() => setComment(""))
                                        }}
                                    >
                                        <Input
                                            onChange={(event) => setComment(event.target.value)}
                                            placeholder="Write a comment..."
                                            value={comment}
                                        />
                                        <Button disabled={commentMutation.isPending} type="submit">
                                            Send
                                        </Button>
                                    </form>
                                ) : (
                                    <p className="mt-4 text-xs text-[var(--muted)]">
                                        Sign in to like and comment.
                                    </p>
                                )}
                            </div>
                        ) : null}
                    </>
                ) : (
                    <div className="flex flex-col gap-2 rounded-[22px] border border-dashed border-[var(--line)] bg-[var(--surface)] p-4 text-sm text-[var(--muted)] sm:flex-row sm:items-center">
                        <LockKeyhole className="size-4 shrink-0 text-[var(--foreground)]" />
                        <span>
                            This post belongs to{" "}
                            <span className="font-medium text-[var(--foreground)]">
                                {"accessLabel" in post ? post.accessLabel : "a locked tier"}
                            </span>
                            . Subscribe or satisfy the access conditions to read it.
                        </span>
                    </div>
                )}
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
