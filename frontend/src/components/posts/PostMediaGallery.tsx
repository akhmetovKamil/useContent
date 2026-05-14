import type {
    PostAttachmentDto,
    PostMediaGridLayoutDto,
    PostMediaLayout,
} from "@shared/types/posts"
import { useState } from "react"

import { PostFileAttachmentButton } from "@/components/posts/PostFileAttachmentButton"
import { PostMediaLightbox } from "@/components/posts/PostMediaLightbox"
import { PostMediaTile } from "@/components/posts/PostMediaTile"
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel"
import { cn } from "@/utils/cn"

interface PostMediaGalleryProps {
    attachments: PostAttachmentDto[]
    getDownloadUrl: (attachment: PostAttachmentDto) => string | null
    mediaGridLayout?: PostMediaGridLayoutDto | null
    mediaLayout?: PostMediaLayout
    onDownload: (attachment: PostAttachmentDto) => void
}

export function PostMediaGallery({
    attachments,
    getDownloadUrl,
    mediaGridLayout,
    mediaLayout = "carousel",
    onDownload,
}: PostMediaGalleryProps) {
    const [preview, setPreview] = useState<{
        attachment: PostAttachmentDto
        objectUrl: string
    } | null>(null)

    if (!attachments.length) {
        return null
    }

    const media = attachments.filter((attachment) => attachment.kind !== "file")
    const files = attachments.filter((attachment) => attachment.kind === "file")
    const canUseFixedGrid =
        media.length > 1 &&
        media.length <= 4 &&
        mediaLayout === "resizable_grid" &&
        mediaGridLayout?.variant === getGridVariant(media.length)

    return (
        <div className="grid gap-3">
            {media.length ? (
                canUseFixedGrid ? (
                    <FixedPostMediaGrid
                        getDownloadUrl={getDownloadUrl}
                        media={media}
                        mediaGridLayout={mediaGridLayout}
                        onDownload={onDownload}
                        onPreview={(attachment, objectUrl) => setPreview({ attachment, objectUrl })}
                    />
                ) : media.length > 1 ? (
                    <Carousel className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
                        <CarouselContent className="-ml-0">
                            {media.map((attachment) => (
                                <CarouselItem className="pl-0" key={attachment.id}>
                                    <PostMediaTile
                                        attachment={attachment}
                                        downloadUrl={getDownloadUrl(attachment)}
                                        onDownload={() => onDownload(attachment)}
                                        onPreview={(objectUrl) =>
                                            setPreview({ attachment, objectUrl })
                                        }
                                    />
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious className="left-3" />
                        <CarouselNext className="right-3" />
                    </Carousel>
                ) : (
                    <div
                        className={cn(
                            "grid gap-2 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]",
                            media.length === 1 ? "grid-cols-1" : "grid-cols-2"
                        )}
                    >
                        {media.map((attachment) => (
                            <PostMediaTile
                                attachment={attachment}
                                downloadUrl={getDownloadUrl(attachment)}
                                key={attachment.id}
                                onDownload={() => onDownload(attachment)}
                                onPreview={(objectUrl) =>
                                    setPreview({ attachment, objectUrl })
                                }
                            />
                        ))}
                    </div>
                )
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
            <PostMediaLightbox
                attachment={preview?.attachment ?? null}
                objectUrl={preview?.objectUrl ?? null}
                onDownload={() => {
                    if (preview) {
                        onDownload(preview.attachment)
                    }
                }}
                onOpenChange={(open) => {
                    if (!open) {
                        setPreview(null)
                    }
                }}
                open={Boolean(preview)}
            />
        </div>
    )
}

interface FixedPostMediaGridProps {
    getDownloadUrl: (attachment: PostAttachmentDto) => string | null
    media: PostAttachmentDto[]
    mediaGridLayout: PostMediaGridLayoutDto
    onDownload: (attachment: PostAttachmentDto) => void
    onPreview: (attachment: PostAttachmentDto, objectUrl: string) => void
}

function FixedPostMediaGrid({
    getDownloadUrl,
    media,
    mediaGridLayout,
    onDownload,
    onPreview,
}: FixedPostMediaGridProps) {
    const sizes = normalizeFixedGridSizes(mediaGridLayout.sizes, media.length)
    const renderTile = (index: number) => (
        <PostMediaTile
            attachment={media[index]}
            className="h-full"
            downloadUrl={getDownloadUrl(media[index])}
            onDownload={() => onDownload(media[index])}
            onPreview={(objectUrl) => onPreview(media[index], objectUrl)}
            showDownloadButton={false}
        />
    )

    if (media.length === 2) {
        return (
            <div
                className="grid min-h-80 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]"
                style={{ gridTemplateColumns: `${sizes[0]}fr ${sizes[1]}fr` }}
            >
                {renderTile(0)}
                {renderTile(1)}
            </div>
        )
    }

    if (media.length === 3) {
        return (
            <div
                className="grid min-h-80 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]"
                style={{ gridTemplateColumns: `${sizes[0]}fr ${sizes[1]}fr` }}
            >
                {renderTile(0)}
                <div
                    className="grid min-h-0"
                    style={{ gridTemplateRows: `${sizes[2]}fr ${sizes[3]}fr` }}
                >
                    {renderTile(1)}
                    {renderTile(2)}
                </div>
            </div>
        )
    }

    return (
        <div
            className="grid min-h-80 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]"
            style={{ gridTemplateColumns: `${sizes[0]}fr ${sizes[1]}fr` }}
        >
            <div
                className="grid min-h-0"
                style={{ gridTemplateRows: `${sizes[2]}fr ${sizes[3]}fr` }}
            >
                {renderTile(0)}
                {renderTile(2)}
            </div>
            <div
                className="grid min-h-0"
                style={{ gridTemplateRows: `${sizes[4]}fr ${sizes[5]}fr` }}
            >
                {renderTile(1)}
                {renderTile(3)}
            </div>
        </div>
    )
}

function normalizeFixedGridSizes(sizes: number[], count: number) {
    const fallback = getGridFallbackSizes(count)

    if (sizes.length === fallback.length) {
        return sizes.map((size) => Math.min(80, Math.max(20, Math.round(size))))
    }

    if (count === 3 && sizes.length === 3) {
        return [
            Math.min(80, Math.max(20, Math.round(sizes[0]))),
            Math.min(80, Math.max(20, Math.round(100 - sizes[0]))),
            Math.min(80, Math.max(20, Math.round(sizes[1]))),
            Math.min(80, Math.max(20, Math.round(sizes[2]))),
        ]
    }

    return fallback
}

function getGridVariant(count: number) {
    return count === 2 ? "two" : count === 3 ? "three" : count === 4 ? "four" : null
}

function getGridFallbackSizes(count: number) {
    if (count === 2) {
        return [50, 50]
    }

    if (count === 3) {
        return [60, 40, 50, 50]
    }

    if (count === 4) {
        return [50, 50, 50, 50, 50, 50]
    }

    return []
}
