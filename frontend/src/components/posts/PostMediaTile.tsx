import type { PostAttachmentDto } from "@shared/types/posts"
import { Download, Music, Play } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { http } from "@/utils/api/http"
import { cn } from "@/utils/cn"

interface PostMediaTileProps {
    attachment: PostAttachmentDto
    className?: string
    downloadUrl: string | null
    onDownload: () => void
}

export function PostMediaTile({
    attachment,
    className,
    downloadUrl,
    onDownload,
}: PostMediaTileProps) {
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
