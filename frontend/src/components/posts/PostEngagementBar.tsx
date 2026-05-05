import { Eye, Heart, MessageCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/utils/cn"

interface PostEngagementBarProps {
    commentsCount: number
    commentsOpen: boolean
    isLikeDisabled: boolean
    likedByMe: boolean
    likesCount: number
    onCommentsToggle: () => void
    onLike: () => void
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
                className="rounded-full"
                onClick={onCommentsToggle}
                size="sm"
                type="button"
                variant={commentsOpen ? "default" : "outline"}
            >
                <MessageCircle className="size-4" />
                {commentsCount}
            </Button>
            <Badge className="rounded-full border border-[var(--line)] bg-transparent">
                <Eye className="size-3.5" />
                {viewsCount} views
            </Badge>
        </div>
    )
}
