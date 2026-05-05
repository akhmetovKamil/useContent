import type { PostAttachmentDto } from "@shared/types/posts"
import { Download, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useOverlayEffects } from "@/hooks/useOverlayEffects"

interface PostMediaLightboxProps {
    attachment: PostAttachmentDto | null
    objectUrl: string | null
    onDownload: () => void
    onOpenChange: (open: boolean) => void
    open: boolean
}

export function PostMediaLightbox({
    attachment,
    objectUrl,
    onDownload,
    onOpenChange,
    open,
}: PostMediaLightboxProps) {
    useOverlayEffects(open, onOpenChange)

    if (!open || !attachment || !objectUrl) {
        return null
    }

    return (
        <div className="fixed inset-0 z-[130] grid h-[100dvh] w-[100dvw] grid-rows-[auto_1fr] overflow-hidden bg-black/85 p-4 text-white backdrop-blur-md">
            <button
                aria-label="Close media preview"
                className="absolute inset-0 cursor-zoom-out"
                onClick={() => onOpenChange(false)}
                type="button"
            />
            <div className="relative z-10 flex min-w-0 items-center justify-between gap-3">
                <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{attachment.fileName}</div>
                    <div className="mt-1 text-xs text-white/60">{attachment.mimeType}</div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        className="rounded-full bg-white text-black hover:bg-white/90"
                        onClick={onDownload}
                        size="sm"
                        type="button"
                    >
                        <Download className="size-4" />
                        Download
                    </Button>
                    <Button
                        aria-label="Close"
                        className="rounded-full bg-white/10 text-white hover:bg-white/20"
                        onClick={() => onOpenChange(false)}
                        size="icon"
                        type="button"
                        variant="ghost"
                    >
                        <X className="size-5" />
                    </Button>
                </div>
            </div>
            <div className="relative z-10 grid min-h-0 place-items-center py-4">
                {attachment.kind === "image" ? (
                    <img
                        alt={attachment.fileName}
                        className="max-h-full max-w-full object-contain"
                        src={objectUrl}
                    />
                ) : null}
                {attachment.kind === "video" ? (
                    <video
                        className="max-h-full max-w-full"
                        controls
                        src={objectUrl}
                    />
                ) : null}
            </div>
        </div>
    )
}
