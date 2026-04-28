import type { PostAttachmentDto, PostReportReason } from "@shared/types/content"
import { Flag } from "lucide-react"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import { AttachedProjectCard } from "@/components/posts/AttachedProjectCard"
import { AuthorActions } from "@/components/posts/AuthorActions"
import { AuthorLine, PostMeta } from "@/components/posts/PostCardHeaderParts"
import { InlineComments } from "@/components/posts/InlineComments"
import { LockedPostPreview } from "@/components/posts/LockedPostPreview"
import { PostEngagementBar } from "@/components/posts/PostEngagementBar"
import { PostMediaGallery } from "@/components/posts/PostMediaGallery"
import { PostText } from "@/components/posts/PostText"
import { ReportPostModal } from "@/components/posts/ReportPostModal"
import type { AuthorPostActions, FeedPost } from "@/components/posts/types"
import { getFeedAuthor, getPostAccess } from "@/components/posts/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    useCreatePostCommentMutation,
    useCreatePostReportMutation,
    useDownloadAuthorPostAttachmentMutation,
    useDownloadMyPostAttachmentMutation,
    usePostCommentsQuery,
    useTogglePostLikeMutation,
} from "@/queries/posts"
import { useAuthStore } from "@/stores/auth-store"

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
