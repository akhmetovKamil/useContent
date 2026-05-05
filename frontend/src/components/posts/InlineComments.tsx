import type { PostCommentDto } from "@shared/types/posts"
import { SendHorizontal } from "lucide-react"
import type { FormEvent } from "react"
import { useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { ProfileAvatar } from "@/components/common/ProfileAvatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/utils/cn"
import { formatPostDate } from "@/utils/date"
import { validateForm } from "@/validation/form"
import { commentSchema } from "@/validation/schemas"

interface InlineCommentsProps {
    authorId: string
    comments?: PostCommentDto[]
    commentsPreview?: PostCommentDto[]
    currentUserAvatarFileId?: string | null
    currentUserDisplayName?: string
    isError?: boolean
    isLoading?: boolean
    isPending?: boolean
    onSubmit: (content: string) => Promise<unknown>
    token: string | null
}

export function InlineComments({
    authorId,
    comments,
    commentsPreview = [],
    currentUserAvatarFileId = null,
    currentUserDisplayName = "You",
    isError = false,
    isLoading = false,
    isPending = false,
    onSubmit,
    token,
}: InlineCommentsProps) {
    const [comment, setComment] = useState("")
    const [fieldError, setFieldError] = useState("")
    const [optimisticComments, setOptimisticComments] = useState<PostCommentDto[]>([])
    const visibleComments = useMemo(() => {
        const base = comments ?? commentsPreview
        return [...base, ...optimisticComments]
    }, [comments, commentsPreview, optimisticComments])

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        const result = validateForm(commentSchema, { content: comment })
        setFieldError(result.success ? "" : (result.fieldErrors.content ?? "Invalid comment."))
        if (!result.success) {
            return
        }
        const nextContent = result.data.content

        const optimistic: PostCommentDto = {
            id: `optimistic-${Date.now()}`,
            authorId,
            postId: "",
            walletAddress: "",
            displayName: currentUserDisplayName,
            avatarFileId: currentUserAvatarFileId,
            isAuthorComment: false,
            content: nextContent,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }

        setComment("")
        setOptimisticComments((current) => [...current, optimistic])

        try {
            await onSubmit(nextContent)
            setOptimisticComments((current) =>
                current.filter((item) => item.id !== optimistic.id)
            )
        } catch {
            setOptimisticComments((current) =>
                current.filter((item) => item.id !== optimistic.id)
            )
            setComment(nextContent)
        }
    }

    return (
        <div className="grid gap-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4">
            {isLoading ? (
                <p className="text-sm text-[var(--muted)]">Loading comments...</p>
            ) : isError ? (
                <p className="text-sm text-rose-600">Failed to load comments.</p>
            ) : visibleComments.length ? (
                <div className="grid gap-3">
                    {visibleComments.map((item) => {
                        const isAuthorComment = item.isAuthorComment
                        const isOptimistic = item.id.startsWith("optimistic-")

                        return (
                            <article
                                className={cn(
                                    "flex gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] p-3",
                                    isAuthorComment
                                        ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                                        : ""
                                )}
                                key={item.id}
                            >
                                <ProfileAvatar
                                    avatarFileId={item.avatarFileId}
                                    className="size-8"
                                    label={item.displayName}
                                />
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                                        <span className="font-medium text-[var(--foreground)]">
                                            {item.displayName}
                                        </span>
                                        {isAuthorComment ? (
                                            <Badge className="rounded-full">Author</Badge>
                                        ) : null}
                                        {isOptimistic ? (
                                            <Badge className="rounded-full">Sending</Badge>
                                        ) : null}
                                        <span>{formatPostDate(item.createdAt)}</span>
                                    </div>
                                    <p className="mt-1 text-sm leading-6 text-[var(--foreground)]">
                                        {item.content}
                                    </p>
                                </div>
                            </article>
                        )
                    })}
                </div>
            ) : (
                <p className="text-sm text-[var(--muted)]">No comments yet.</p>
            )}

            {token ? (
                <form className="flex gap-2" onSubmit={handleSubmit}>
                    <Input
                        aria-invalid={Boolean(fieldError)}
                        onChange={(event) => setComment(event.target.value)}
                        placeholder="Write a comment..."
                        value={comment}
                    />
                    <Button disabled={isPending} size="icon" type="submit">
                        <SendHorizontal className="size-4" />
                    </Button>
                    {fieldError ? (
                        <p className="basis-full text-xs text-rose-600">{fieldError}</p>
                    ) : null}
                </form>
            ) : (
                <p className="text-xs text-[var(--muted)]">Sign in to like and comment.</p>
            )}
        </div>
    )
}
