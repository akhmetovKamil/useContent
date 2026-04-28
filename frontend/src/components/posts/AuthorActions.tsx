import { CONTENT_STATUS } from "@shared/consts"
import type { PostDto } from "@shared/types/content"
import { Archive, ExternalLink, Megaphone, Pencil, RotateCcw, Send, Trash2 } from "lucide-react"
import { Link } from "react-router-dom"

import { IconAction } from "@/components/posts/IconAction"
import type { AuthorPostActions, FeedPost } from "@/components/posts/types"
import { Button } from "@/components/ui/button"

export function AuthorActions({
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
            {post.status === CONTENT_STATUS.PUBLISHED && (onPromote || onStopPromotion) ? (
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
            {post.status !== CONTENT_STATUS.ARCHIVED ? (
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
