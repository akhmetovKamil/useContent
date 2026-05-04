import type {
    PostAttachmentDto,
    PostMediaGridLayoutDto,
    PostMediaLayout,
} from "@shared/types/posts"
import { Fragment } from "react"

import { PostFileAttachmentButton } from "@/components/posts/PostFileAttachmentButton"
import { PostMediaTile } from "@/components/posts/PostMediaTile"
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
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
    if (!attachments.length) {
        return null
    }

    const media = attachments.filter((attachment) => attachment.kind !== "file")
    const files = attachments.filter((attachment) => attachment.kind === "file")

    return (
        <div className="grid gap-3">
            {media.length ? (
                media.length > 1 &&
                media.length <= 4 &&
                mediaLayout === "resizable_grid" &&
                mediaGridLayout ? (
                    <ResizablePanelGroup
                        className="min-h-80 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]"
                        defaultLayout={mediaGridLayout.sizes.reduce<Record<string, number>>(
                            (layout, size, index) => {
                                layout[`media-${index}`] = size
                                return layout
                            },
                            {}
                        )}
                        direction="horizontal"
                    >
                        {media.map((attachment, index) => (
                            <Fragment key={attachment.id}>
                                <ResizablePanel
                                    defaultSize={mediaGridLayout.sizes[index]}
                                    id={`media-${index}`}
                                    minSize={20}
                                >
                                    <PostMediaTile
                                        attachment={attachment}
                                        className="h-full"
                                        downloadUrl={getDownloadUrl(attachment)}
                                        onDownload={() => onDownload(attachment)}
                                    />
                                </ResizablePanel>
                                {index < media.length - 1 ? <ResizableHandle /> : null}
                            </Fragment>
                        ))}
                    </ResizablePanelGroup>
                ) : media.length > 1 ? (
                    <Carousel className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
                        <CarouselContent className="-ml-0">
                            {media.map((attachment) => (
                                <CarouselItem className="pl-0" key={attachment.id}>
                                    <PostMediaTile
                                        attachment={attachment}
                                        downloadUrl={getDownloadUrl(attachment)}
                                        onDownload={() => onDownload(attachment)}
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
        </div>
    )
}
