import type { PostAttachmentDto } from "@shared/types/content"
import { Download, FileText, Music, Play } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { http } from "@/utils/api/http"
import { cn } from "@/utils/cn"
import { formatFileSize } from "@/utils/format"

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
                        <MediaTile
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
                        <button
                            className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 text-left transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
                            key={attachment.id}
                            onClick={() => onDownload(attachment)}
                            type="button"
                        >
                            <span className="flex min-w-0 items-center gap-3">
                                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--surface-strong)]">
                                    <FileText className="size-5" />
                                </span>
                                <span className="min-w-0">
                                    <span className="block truncate text-sm font-medium text-[var(--foreground)]">
                                        {attachment.fileName}
                                    </span>
                                    <span className="mt-1 block text-xs text-[var(--muted)]">
                                        {attachment.mimeType} · {formatFileSize(attachment.size)}
                                    </span>
                                </span>
                            </span>
                            <Download className="size-4 shrink-0 text-[var(--muted)]" />
                        </button>
                    ))}
                </div>
            ) : null}
        </div>
    )
}

function MediaTile({
    attachment,
    className,
    downloadUrl,
    onDownload,
}: {
    attachment: PostAttachmentDto
    className?: string
    downloadUrl: string | null
    onDownload: () => void
}) {
    const [objectUrl, setObjectUrl] = useState<string | null>(null)

    useEffect(() => {
        if (!downloadUrl) {
            return
        }

        let active = true
        let nextUrl: string | null = null

        http.get<Blob>(downloadUrl, { responseType: "blob" })
            .then((response) => {
                if (!active) {
                    return
                }
                nextUrl = URL.createObjectURL(response.data)
                setObjectUrl(nextUrl)
            })
            .catch(() => {
                if (active) {
                    setObjectUrl(null)
                }
            })

        return () => {
            active = false
            if (nextUrl) {
                URL.revokeObjectURL(nextUrl)
            }
        }
    }, [downloadUrl])

    return (
        <div
            className={cn(
                "group relative min-h-44 overflow-hidden bg-[var(--surface-strong)]",
                className
            )}
        >
            {attachment.kind === "image" && objectUrl ? (
                <img
                    alt={attachment.fileName}
                    className="h-full max-h-[520px] min-h-44 w-full object-cover"
                    src={objectUrl}
                />
            ) : null}
            {attachment.kind === "video" && objectUrl ? (
                <video
                    className="h-full max-h-[520px] min-h-44 w-full object-cover"
                    controls
                    src={objectUrl}
                />
            ) : null}
            {attachment.kind === "audio" ? (
                <div className="grid h-full min-h-44 place-items-center p-5">
                    <div className="w-full rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4">
                        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
                            <Music className="size-4" />
                            {attachment.fileName}
                        </div>
                        {objectUrl ? <audio className="w-full" controls src={objectUrl} /> : null}
                    </div>
                </div>
            ) : null}
            {!objectUrl && attachment.kind !== "audio" ? (
                <div className="grid h-full min-h-44 place-items-center p-5 text-sm text-[var(--muted)]">
                    <div className="grid justify-items-center gap-2">
                        <Play className="size-5" />
                        Loading preview
                    </div>
                </div>
            ) : null}
            <div className="absolute right-3 bottom-3 opacity-0 transition group-hover:opacity-100">
                <Button
                    className="rounded-full shadow-[var(--shadow)]"
                    onClick={onDownload}
                    size="sm"
                    type="button"
                >
                    <Download className="size-4" />
                    Download
                </Button>
            </div>
        </div>
    )
}
