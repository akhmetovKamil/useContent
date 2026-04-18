import { Eye, Heart, MessageCircle } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"

import { PostAttachmentPreview } from "@/components/posts/PostAttachmentPreview"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAuthorProfileQuery } from "@/queries/authors"
import {
    useAuthorPostQuery,
    useCreatePostCommentMutation,
    useDownloadAuthorPostAttachmentMutation,
    usePostCommentsQuery,
    useRecordPostViewMutation,
    useTogglePostLikeMutation,
} from "@/queries/posts"
import { useAuthStore } from "@/stores/auth-store"
import { cn } from "@/utils/cn"

export function PostPage() {
    const { slug = "", postId = "" } = useParams()
    const token = useAuthStore((state) => state.token)
    const [comment, setComment] = useState("")
    const postQuery = useAuthorPostQuery(slug, postId)
    const authorQuery = useAuthorProfileQuery(slug)
    const commentsQuery = usePostCommentsQuery(slug, postId, Boolean(postQuery.data))
    const likeMutation = useTogglePostLikeMutation(slug, postId)
    const commentMutation = useCreatePostCommentMutation(slug, postId)
    const recordViewMutation = useRecordPostViewMutation(slug, postId)
    const downloadAttachmentMutation = useDownloadAuthorPostAttachmentMutation(slug, postId)
    const author = authorQuery.data
    const post = postQuery.data
    const viewerKey = useMemo(() => getViewerKey(), [])

    useEffect(() => {
        if (post && slug && postId && viewerKey) {
            void recordViewMutation.mutateAsync(viewerKey)
        }
    }, [post?.id, postId, slug, viewerKey])

    return (
        <section className="grid gap-6">
            <Card className="rounded-[32px] bg-[var(--surface-strong)]">
                <CardHeader>
                    <div className="font-mono text-xs uppercase tracking-[0.35em] text-[var(--muted)]">
                        Post details
                    </div>
                    {postQuery.isLoading ? (
                        <CardTitle>Loading post...</CardTitle>
                    ) : postQuery.isError ? (
                        <p className="text-rose-600">
                            Failed to open @{slug}'s post: {postQuery.error.message}
                        </p>
                    ) : post ? (
                        <>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--muted)]">
                                <Link
                                    className="font-medium text-[var(--foreground)] underline-offset-4 hover:underline"
                                    to={`/authors/${slug}`}
                                >
                                    {author?.displayName ?? slug}
                                </Link>
                                <span>@{slug}</span>
                                <span>{formatDate(post.publishedAt ?? post.createdAt)}</span>
                                <Badge className="rounded-full">{post.status}</Badge>
                                <Badge className="rounded-full">
                                    {post.policyMode === "public"
                                        ? "Public"
                                        : post.policyMode === "custom"
                                          ? "Custom tier"
                                          : "Default tier"}
                                </Badge>
                            </div>
                            <CardTitle className="font-[var(--serif)] text-4xl">
                                {post.title}
                            </CardTitle>
                            <div className="flex flex-wrap gap-2">
                                <Badge className="rounded-full border border-[var(--line)] bg-transparent">
                                    <Eye className="size-3.5" />
                                    {post.viewsCount} views
                                </Badge>
                                <Badge className="rounded-full border border-[var(--line)] bg-transparent">
                                    <Heart className="size-3.5" />
                                    {post.likesCount} likes
                                </Badge>
                                <Badge className="rounded-full border border-[var(--line)] bg-transparent">
                                    <MessageCircle className="size-3.5" />
                                    {post.commentsCount} comments
                                </Badge>
                            </div>
                        </>
                    ) : null}
                </CardHeader>
                {post ? (
                    <CardContent className="grid gap-6">
                        <p className="whitespace-pre-wrap text-base leading-7 text-[var(--foreground)]">
                            {post.content}
                        </p>

                        {post.attachments.length ? (
                            <div className="grid gap-4">
                                {post.attachments.map((attachment) => (
                                    <PostAttachmentPreview
                                        attachment={attachment}
                                        downloadUrl={`/post-files/download/${slug}/${post.id}/${attachment.id}`}
                                        key={attachment.id}
                                        onDownload={() =>
                                            void downloadAttachmentMutation.mutateAsync({
                                                attachmentId: attachment.id,
                                                fileName: attachment.fileName,
                                            })
                                        }
                                    />
                                ))}
                            </div>
                        ) : null}

                        <div className="flex flex-wrap gap-2">
                            <Button
                                className="rounded-full"
                                disabled={!token || likeMutation.isPending}
                                onClick={() => void likeMutation.mutateAsync()}
                                type="button"
                                variant={post.likedByMe ? "default" : "outline"}
                            >
                                <Heart
                                    className={cn("size-4", post.likedByMe ? "fill-current" : "")}
                                />
                                {post.likesCount}
                            </Button>
                        </div>
                    </CardContent>
                ) : null}
            </Card>

            {post ? (
                <Card className="rounded-[32px]">
                    <CardHeader>
                        <CardTitle>Comments</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {commentsQuery.isLoading ? (
                            <p className="text-sm text-[var(--muted)]">Loading comments...</p>
                        ) : commentsQuery.isError ? (
                            <p className="text-sm text-rose-600">
                                Failed to load comments: {commentsQuery.error.message}
                            </p>
                        ) : commentsQuery.data?.length ? (
                            <div className="grid gap-3">
                                {commentsQuery.data.map((item) => {
                                    const isAuthorComment = item.authorId === post.authorId

                                    return (
                                        <div
                                            className={cn(
                                                "rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-4",
                                                isAuthorComment
                                                    ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                                                    : ""
                                            )}
                                            key={item.id}
                                        >
                                            <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                                                <span className="font-medium text-[var(--foreground)]">
                                                    {item.displayName}
                                                </span>
                                                {isAuthorComment ? (
                                                    <Badge className="rounded-full">Author</Badge>
                                                ) : null}
                                                <span>{formatDate(item.createdAt)}</span>
                                            </div>
                                            <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">
                                                {item.content}
                                            </p>
                                        </div>
                                    )
                                })}
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
                    </CardContent>
                </Card>
            ) : null}
        </section>
    )
}

function getViewerKey() {
    const key = "usecontent.viewerKey"
    const existing = window.localStorage.getItem(key)
    if (existing) {
        return existing
    }

    const next = crypto.randomUUID()
    window.localStorage.setItem(key, next)
    return next
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat("en", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(new Date(value))
}
