import type { PostAttachmentDto } from "@shared/types/posts"
import { Download, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "@/components/ui/dialog"

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
    return (
        <Dialog onOpenChange={onOpenChange} open={open}>
            <DialogContent
                className="grid h-[100dvh] max-h-[100dvh] w-[100dvw] max-w-none grid-rows-[auto_1fr] overflow-hidden border-0 bg-black/90 p-4 text-white shadow-none backdrop-blur-md sm:max-w-none"
                showCloseButton={false}
            >
                <DialogTitle className="sr-only">
                    {attachment?.fileName ?? "Media preview"}
                </DialogTitle>
                <DialogDescription className="sr-only">
                    Fullscreen post media preview.
                </DialogDescription>
                {attachment && objectUrl ? (
                    <>
                        <div className="flex min-w-0 items-center justify-between gap-3">
                            <div className="min-w-0">
                                <div className="truncate text-sm font-medium">
                                    {attachment.fileName}
                                </div>
                                <div className="mt-1 text-xs text-white/60">
                                    {attachment.mimeType}
                                </div>
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
                        <div className="grid min-h-0 place-items-center py-4">
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
                    </>
                ) : null}
            </DialogContent>
        </Dialog>
    )
}
