import type { PostAttachmentDto } from "@shared/types/posts"

import { PostFileAttachmentButton } from "@/components/posts/PostFileAttachmentButton"
import { PostMediaTile } from "@/components/posts/PostMediaTile"
import { cn } from "@/utils/cn"

interface PostMediaGalleryProps {
    attachments: PostAttachmentDto[]
    getDownloadUrl: (attachment: PostAttachmentDto) => string | null
    onDownload: (attachment: PostAttachmentDto) => void
}

export function PostMediaGallery({
    attachments,
    getDownloadUrl,
    onDownload,
}: PostMediaGalleryProps) {
    if (!attachments.length) {
        return null
    }

    const media = attachments.filter((attachment) => attachment.kind !== "file")
    const files = attachments.filter((attachment) => attachment.kind === "file")

    return (
        <div className="grid gap-3">
            {media.length ? (
                <div
                    className={cn(
                        "grid gap-2 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]",
                        media.length === 1 ? "grid-cols-1" : "grid-cols-2"
                    )}
                >
                    {media.map((attachment, index) => (
                        <PostMediaTile
                            attachment={attachment}
                            className={
                                media.length === 3 && index === 0 ? "sm:row-span-2" : undefined
                            }
                            downloadUrl={getDownloadUrl(attachment)}
                            key={attachment.id}
                            onDownload={() => onDownload(attachment)}
                        />
                    ))}
                </div>
            ) : null}

            {files.length ? (
                <div className="grid gap-2 sm:grid-cols-2">
                    {files.map((attachment) => (
                        <PostFileAttachmentButton
                            attachment={attachment}
                            key={attachment.id}
                            onDownload={() => onDownload(attachment)}
                        />
                    ))}
                </div>
            ) : null}
        </div>
    )
}
