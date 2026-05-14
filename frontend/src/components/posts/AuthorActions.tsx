import { CONTENT_STATUS } from "@shared/consts"
import type { PostDto } from "@shared/types/posts"
import { Archive, LockKeyhole, Megaphone, Pencil, RotateCcw, Send, Trash2 } from "lucide-react"

import { IconAction } from "@/components/common/IconAction"
import type { AuthorPostActions, FeedPost } from "@/components/posts/types"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export function AuthorActions({
    onArchive,
    onDelete,
    onEdit,
    isPromoteLocked = false,
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
            {post.status === CONTENT_STATUS.DRAFT ? (
                <IconAction icon={Send} label="Publish" onClick={() => onPublish?.(editablePost)} />
            ) : null}
            {post.status === CONTENT_STATUS.ARCHIVED ? (
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
            {post.status === CONTENT_STATUS.PUBLISHED && (onPromote || onStopPromotion || isPromoteLocked) ? (
                isPromoted && onStopPromotion ? (
                    <IconAction
                        icon={Megaphone}
                        label="Pause promo"
                        onClick={() => onStopPromotion?.(editablePost)}
                    />
                ) : isPromoteLocked ? (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span className="inline-flex">
                                <Button
                                    className="rounded-full"
                                    disabled
                                    size="sm"
                                    type="button"
                                    variant="outline"
                                >
                                    <LockKeyhole className="size-4" />
                                    Promote
                                </Button>
                            </span>
                        </TooltipTrigger>
                        <TooltipContent>
                            Upgrade billing to unlock homepage promotion.
                        </TooltipContent>
                    </Tooltip>
                ) : onPromote ? (
                    <IconAction
                        icon={Megaphone}
                        label="Promote"
                        onClick={() => onPromote(editablePost)}
                    />
                ) : null
            ) : null}
            {post.status !== CONTENT_STATUS.ARCHIVED ? (
                <IconAction
                    icon={Archive}
                    label="Archive"
                    onClick={() => onArchive?.(editablePost)}
                />
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
