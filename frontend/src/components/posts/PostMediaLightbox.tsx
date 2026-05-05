import type { PostAttachmentDto } from "@shared/types/posts"
import { Download, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogClose,
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
                className="w-auto max-w-[92vw] border-0 bg-transparent p-0 text-white shadow-none sm:max-w-[92vw]"
                showCloseButton={false}
            >
                <DialogTitle className="sr-only">
                    {attachment?.fileName ?? "Media preview"}
                </DialogTitle>
                <DialogDescription className="sr-only">
                    Fullscreen post media preview.
                </DialogDescription>
                {attachment && objectUrl ? (
                    <div className="grid max-h-[90dvh] max-w-[92vw] gap-4">
                        <div className="flex min-w-0 items-center justify-between gap-3 rounded-2xl bg-black/45 px-4 py-3 shadow-lg backdrop-blur-md">
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
                                <DialogClose asChild>
                                    <Button
                                        aria-label="Close"
                                        className="rounded-full bg-white/10 text-white hover:bg-white/20"
                                        size="icon"
                                        type="button"
                                        variant="ghost"
                                    >
                                        <X className="size-5" />
                                    </Button>
                                </DialogClose>
                            </div>
                        </div>
                        <div className="grid min-h-0 place-items-center">
                            {attachment.kind === "image" ? (
                                <img
                                    alt={attachment.fileName}
                                    className="max-h-[75dvh] max-w-[75vw] rounded-2xl object-contain shadow-[0_24px_90px_rgba(0,0,0,0.35)]"
                                    src={objectUrl}
                                />
                            ) : null}
                            {attachment.kind === "video" ? (
                                <video
                                    className="max-h-[75dvh] max-w-[75vw] rounded-2xl shadow-[0_24px_90px_rgba(0,0,0,0.35)]"
                                    controls
                                    src={objectUrl}
                                />
                            ) : null}
                        </div>
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    )
}
