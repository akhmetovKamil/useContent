import { Eye, Heart, MessageCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/utils/cn"
import { formatPostDate } from "@/utils/date"

interface PostEngagementBarProps {
    commentsCount: number
    commentsOpen: boolean
    isLikeDisabled: boolean
    likedByMe: boolean
    likesCount: number
    onCommentsToggle: () => void
    onLike: () => void
    publishedAt?: string | null
    accessLabel?: string | null
    hasAccess?: boolean
    viewsCount: number
}

export function PostEngagementBar({
    commentsCount,
    commentsOpen,
    isLikeDisabled,
    likedByMe,
    likesCount,
    onCommentsToggle,
    onLike,
    publishedAt,
    accessLabel,
    hasAccess = true,
    viewsCount,
}: PostEngagementBarProps) {
    return (
        <div className="flex flex-wrap items-center gap-2 border-t border-[var(--line)] pt-4">
            <Button
                className="rounded-full"
                disabled={isLikeDisabled}
                onClick={onLike}
                size="sm"
                type="button"
                variant={likedByMe ? "default" : "outline"}
            >
                <Heart className={cn("size-4", likedByMe ? "fill-current" : "")} />
                {likesCount}
            </Button>
            <Button
                aria-label={commentsOpen ? "Hide comments" : "Show comments"}
                aria-pressed={commentsOpen}
                className="rounded-full"
                onClick={onCommentsToggle}
                size="sm"
                type="button"
                variant={commentsOpen ? "default" : "outline"}
            >
                <MessageCircle className="size-4" />
                {commentsCount}
            </Button>
            <div className="ml-auto flex flex-wrap items-center justify-end gap-x-3 gap-y-2 text-xs text-[var(--muted)]">
                <span className="inline-flex items-center gap-1.5">
                    <Eye className="size-3.5" />
                    {viewsCount} views
                </span>
                {accessLabel ? (
                    <Badge className="rounded-full" variant={hasAccess ? "success" : "warning"}>
                        {accessLabel}
                    </Badge>
                ) : null}
                {publishedAt ? <span>{formatPostDate(publishedAt)}</span> : null}
            </div>
        </div>
    )
}
