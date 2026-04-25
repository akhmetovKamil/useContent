import type { PostAttachmentDto, PostDto, PostReportReason } from "@shared/types/content"
import { Archive, ExternalLink, Flag, Megaphone, Pencil, RotateCcw, Send, Trash2 } from "lucide-react"
import type { ComponentType } from "react"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import { AttachedProjectCard } from "@/components/posts/AttachedProjectCard"
import { formatPostDate } from "@/components/posts/date"
import { InlineComments } from "@/components/posts/InlineComments"
import { LockedPostPreview } from "@/components/posts/LockedPostPreview"
import { PostEngagementBar } from "@/components/posts/PostEngagementBar"
import { PostMediaGallery } from "@/components/posts/PostMediaGallery"
import type { AuthorPostActions, FeedPost } from "@/components/posts/types"
import { getFeedAuthor, getPostAccess } from "@/components/posts/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Modal } from "@/components/ui/modal"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
    useCreatePostCommentMutation,
    useCreatePostReportMutation,
    useDownloadAuthorPostAttachmentMutation,
    useDownloadMyPostAttachmentMutation,
    usePostCommentsQuery,
    useTogglePostLikeMutation,
} from "@/queries/posts"
import { useAuthStore } from "@/stores/auth-store"
import { cn } from "@/utils/cn"

interface PostCardProps extends AuthorPostActions {
    commentsMode?: "inline" | "hidden"
    isAuthorView?: boolean
    post: FeedPost
    showAuthor?: boolean
}

export function PostCard({
    commentsMode = "inline",
    isAuthorView = false,
    onArchive,
    onDelete,
    onEdit,
    onPublish,
    onPromote,
    onRestoreDraft,
    onStopPromotion,
    onUnarchive,
    post,
    showAuthor = false,
}: PostCardProps) {
    const token = useAuthStore((state) => state.token)
    const [commentsOpen, setCommentsOpen] = useState(false)
    const [expanded, setExpanded] = useState(false)
    const [reportOpen, setReportOpen] = useState(false)
    const [reportReason, setReportReason] = useState<PostReportReason>("spam")
    const [reportComment, setReportComment] = useState("")
    const [reportSubmitted, setReportSubmitted] = useState(false)
    const [optimisticLiked, setOptimisticLiked] = useState(post.likedByMe)
    const [optimisticLikesCount, setOptimisticLikesCount] = useState(post.likesCount)
    const author = getFeedAuthor(post)
    const hasAccess = getPostAccess(post)
    const postLink = author ? `/authors/${author.authorSlug}/posts/${post.id}` : undefined
    const commentsPreview = "commentsPreview" in post ? post.commentsPreview : []
    const commentsQuery = usePostCommentsQuery(
        author?.authorSlug ?? "",
        post.id,
        Boolean(author) && commentsOpen && hasAccess
    )
    const likeMutation = useTogglePostLikeMutation(author?.authorSlug ?? "", post.id)
    const commentMutation = useCreatePostCommentMutation(author?.authorSlug ?? "", post.id)
    const reportMutation = useCreatePostReportMutation(author?.authorSlug ?? "", post.id)
    const downloadMyAttachmentMutation = useDownloadMyPostAttachmentMutation()
    const downloadAuthorAttachmentMutation = useDownloadAuthorPostAttachmentMutation(
        author?.authorSlug ?? "",
        post.id
    )

    useEffect(() => {
        setOptimisticLiked(post.likedByMe)
        setOptimisticLikesCount(post.likesCount)
    }, [post.likedByMe, post.likesCount])

    async function handleLike() {
        if (!author || !token || likeMutation.isPending) {
            return
        }

        const previousLiked = optimisticLiked
        const previousLikesCount = optimisticLikesCount
        const nextLiked = !previousLiked
        setOptimisticLiked(nextLiked)
        setOptimisticLikesCount((count) => Math.max(0, count + (nextLiked ? 1 : -1)))

        try {
            const result = await likeMutation.mutateAsync()
            setOptimisticLiked(result.liked)
            setOptimisticLikesCount(result.likesCount)
        } catch {
            setOptimisticLiked(previousLiked)
            setOptimisticLikesCount(previousLikesCount)
        }
    }

    function getDownloadUrl(attachment: PostAttachmentDto) {
        if (isAuthorView) {
            return `/me/post-files/download/${post.id}/${attachment.id}`
        }
        if (!author) {
            return null
        }
        return `/post-files/download/${author.authorSlug}/${post.id}/${attachment.id}`
    }

    function downloadAttachment(attachment: PostAttachmentDto) {
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
    }

    return (
        <Card className="overflow-hidden rounded-2xl border-[var(--line)] bg-[var(--surface)] shadow-[0_12px_40px_rgba(15,23,42,0.04)] transition-colors hover:bg-[var(--surface-strong)]">
            <CardHeader className="gap-4 pb-3">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                        {showAuthor && author ? <AuthorLine post={author} /> : null}
                        <CardTitle className="text-xl leading-7">
                            {postLink ? (
                                <Link className="underline-offset-4 hover:underline" to={postLink}>
                                    {post.title}
                                </Link>
                            ) : (
                                post.title
                            )}
                        </CardTitle>
                        <PostMeta post={post} />
                    </div>
                    {isAuthorView ? (
                        <AuthorActions
                            onArchive={onArchive}
                            onDelete={onDelete}
                            onEdit={onEdit}
                            onPublish={onPublish}
                            onPromote={onPromote}
                            onRestoreDraft={onRestoreDraft}
                            onStopPromotion={onStopPromotion}
                            onUnarchive={onUnarchive}
                            post={post}
                        />
                    ) : author && token ? (
                        <Button
                            className="rounded-full"
                            onClick={() => setReportOpen(true)}
                            size="sm"
                            type="button"
                            variant="outline"
                        >
                            <Flag className="size-4" />
                            Report
                        </Button>
                    ) : null}
                </div>
            </CardHeader>

            <CardContent className="grid gap-4">
                {hasAccess ? (
                    <>
                        <PostText
                            content={post.content}
                            expanded={expanded}
                            onToggle={() => setExpanded((value) => !value)}
                        />
                        <PostMediaGallery
                            attachments={post.attachments ?? []}
                            getDownloadUrl={getDownloadUrl}
                            onDownload={downloadAttachment}
                        />
                        {author && post.linkedProjectIds.length ? (
                            <div className="grid gap-2">
                                {post.linkedProjectIds.map((projectId, index) => (
                                    <AttachedProjectCard
                                        href={
                                            isAuthorView
                                                ? "/me/projects"
                                                : `/authors/${author.authorSlug}/projects/${projectId}`
                                        }
                                        index={index}
                                        key={projectId}
                                    />
                                ))}
                            </div>
                        ) : null}
                        <PostEngagementBar
                            commentsCount={post.commentsCount}
                            commentsOpen={commentsOpen}
                            isLikeDisabled={!author || !token || likeMutation.isPending}
                            likedByMe={optimisticLiked}
                            likesCount={optimisticLikesCount}
                            onCommentsToggle={() => setCommentsOpen((value) => !value)}
                            onLike={() => void handleLike()}
                            viewsCount={post.viewsCount}
                        />
                        {commentsMode === "inline" && author && (commentsOpen || commentsPreview.length) ? (
                            <InlineComments
                                authorId={post.authorId}
                                comments={commentsOpen ? commentsQuery.data : undefined}
                                commentsPreview={commentsPreview}
                                isError={commentsQuery.isError}
                                isLoading={commentsOpen && commentsQuery.isLoading}
                                isPending={commentMutation.isPending}
                                onSubmit={(content) =>
                                    commentMutation.mutateAsync({ content })
                                }
                                token={token}
                            />
                        ) : null}
                    </>
                ) : (
                    <LockedPostPreview post={post} />
                )}
            </CardContent>
            {author ? (
                <ReportPostModal
                    comment={reportComment}
                    error={reportMutation.error}
                    isPending={reportMutation.isPending}
                    onCommentChange={setReportComment}
                    onOpenChange={(open) => {
                        setReportOpen(open)
                        if (!open) {
                            setReportSubmitted(false)
                        }
                    }}
                    onReasonChange={setReportReason}
                    onSubmit={() =>
                        void reportMutation
                            .mutateAsync({
                                comment: reportComment,
                                reason: reportReason,
                            })
                            .then(() => {
                                setReportSubmitted(true)
                                setReportComment("")
                            })
                    }
                    open={reportOpen}
                    reason={reportReason}
                    submitted={reportSubmitted}
                />
            ) : null}
        </Card>
    )
}

function ReportPostModal({
    comment,
    error,
    isPending,
    onCommentChange,
    onOpenChange,
    onReasonChange,
    onSubmit,
    open,
    reason,
    submitted,
}: {
    comment: string
    error: Error | null
    isPending: boolean
    onCommentChange: (value: string) => void
    onOpenChange: (open: boolean) => void
    onReasonChange: (value: PostReportReason) => void
    onSubmit: () => void
    open: boolean
    reason: PostReportReason
    submitted: boolean
}) {
    return (
        <Modal
            description="Reports help keep promoted and public posts safe. The post will not be hidden automatically."
            onOpenChange={onOpenChange}
            open={open}
            title="Report post"
        >
            {submitted ? (
                <div className="grid gap-4">
                    <p className="text-sm leading-6 text-[var(--muted)]">
                        Thanks. The report was saved for future moderation review.
                    </p>
                    <Button className="w-fit rounded-full" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </div>
            ) : (
                <form
                    className="grid gap-4"
                    onSubmit={(event) => {
                        event.preventDefault()
                        onSubmit()
                    }}
                >
                    <Select
                        onValueChange={(value) => onReasonChange(value as PostReportReason)}
                        value={reason}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="spam">Spam</SelectItem>
                            <SelectItem value="scam">Scam or fraud</SelectItem>
                            <SelectItem value="illegal_content">Illegal content</SelectItem>
                            <SelectItem value="abuse">Abuse or harassment</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                    <Textarea
                        className="min-h-28"
                        maxLength={1000}
                        onChange={(event) => onCommentChange(event.target.value)}
                        placeholder="Optional context for moderation..."
                        value={comment}
                    />
                    {error ? <p className="text-sm text-rose-600">{error.message}</p> : null}
                    <div className="flex justify-end gap-2">
                        <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
                            Cancel
                        </Button>
                        <Button disabled={isPending} type="submit">
                            {isPending ? "Saving..." : "Submit report"}
                        </Button>
                    </div>
                </form>
            )}
        </Modal>
    )
}

function AuthorLine({ post }: { post: Extract<FeedPost, { authorSlug: string }> }) {
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

function PostMeta({ post }: { post: FeedPost }) {
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

function PostText({
    content,
    expanded,
    onToggle,
}: {
    content: string
    expanded: boolean
    onToggle: () => void
}) {
    const isLong = content.length > 420

    return (
        <div className="grid gap-2">
            <p
                className={cn(
                    "whitespace-pre-wrap text-sm leading-6 text-[var(--foreground)]",
                    isLong && !expanded ? "line-clamp-5" : ""
                )}
            >
                {content}
            </p>
            {isLong ? (
                <button
                    className="w-fit text-sm font-medium text-[var(--accent)] underline-offset-4 hover:underline"
                    onClick={onToggle}
                    type="button"
                >
                    {expanded ? "Show less" : "Show more"}
                </button>
            ) : null}
        </div>
    )
}

function AuthorActions({
    onArchive,
    onDelete,
    onEdit,
    onPublish,
    onPromote,
    onRestoreDraft,
    onStopPromotion,
    onUnarchive,
    post,
}: AuthorPostActions & { post: FeedPost }) {
    const editablePost = post as PostDto
    const isPromoted = post.promotion?.active === true

    return (
        <div className="flex flex-wrap justify-end gap-2">
            {post.status === "draft" ? (
                <IconAction icon={Send} label="Publish" onClick={() => onPublish?.(editablePost)} />
            ) : null}
            {post.status === "archived" ? (
                <>
                    <IconAction
                        icon={RotateCcw}
                        label="Restore draft"
                        onClick={() => onRestoreDraft?.(editablePost)}
                    />
                    <IconAction
                        icon={Send}
                        label="Publish"
                        onClick={() => onUnarchive?.(editablePost)}
                    />
                </>
            ) : null}
            <IconAction icon={Pencil} label="Edit" onClick={() => onEdit?.(editablePost)} />
            {post.status === "published" && (onPromote || onStopPromotion) ? (
                isPromoted && onStopPromotion ? (
                    <IconAction
                        icon={Megaphone}
                        label="Pause promo"
                        onClick={() => onStopPromotion?.(editablePost)}
                    />
                ) : onPromote ? (
                    <IconAction
                        icon={Megaphone}
                        label="Promote"
                        onClick={() => onPromote(editablePost)}
                    />
                ) : null
            ) : null}
            {post.status !== "archived" ? (
                <IconAction
                    icon={Archive}
                    label="Archive"
                    onClick={() => onArchive?.(editablePost)}
                />
            ) : null}
            {"authorSlug" in post ? (
                <Button asChild className="rounded-full" size="sm" type="button" variant="outline">
                    <Link to={`/authors/${post.authorSlug}/posts/${post.id}`}>
                        <ExternalLink className="size-4" />
                        Open
                    </Link>
                </Button>
            ) : null}
            <Button
                className="rounded-full"
                onClick={() => onDelete?.(editablePost)}
                size="sm"
                type="button"
                variant="destructive"
            >
                <Trash2 className="size-4" />
                Delete
            </Button>
        </div>
    )
}

function IconAction({
    icon: Icon,
    label,
    onClick,
}: {
    icon: ComponentType<{ className?: string }>
    label: string
    onClick: () => void
}) {
    return (
        <Button
            className="rounded-full"
            onClick={onClick}
            size="sm"
            type="button"
            variant="outline"
        >
            <Icon className="size-4" />
            {label}
        </Button>
    )
}
