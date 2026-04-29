import type { PostAttachmentDto } from "@shared/types/posts"
import { Download } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { http } from "@/utils/api/http"
import { formatFileSize } from "@/utils/format"

interface PostAttachmentPreviewProps {
    attachment: PostAttachmentDto
    downloadUrl: string
    onDownload: () => void
}

export function PostAttachmentPreview({
    attachment,
    downloadUrl,
    onDownload,
}: PostAttachmentPreviewProps) {
    const [objectUrl, setObjectUrl] = useState<string | null>(null)
    const canPreview =
        attachment.kind === "image" || attachment.kind === "video" || attachment.kind === "audio"

    useEffect(() => {
        if (!canPreview) {
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
    }, [canPreview, downloadUrl])

    return (
        <Card className="overflow-hidden rounded-[24px] bg-[var(--surface)]">
            {attachment.kind === "image" && objectUrl ? (
                <img
                    alt={attachment.fileName}
                    className="max-h-[520px] w-full object-contain"
                    src={objectUrl}
                />
            ) : null}
            {attachment.kind === "video" && objectUrl ? (
                <video className="w-full" controls src={objectUrl} />
            ) : null}
            {attachment.kind === "audio" && objectUrl ? (
                <div className="p-4">
                    <audio className="w-full" controls src={objectUrl} />
                </div>
            ) : null}
            {!canPreview ? (
                <div className="p-4 text-sm text-[var(--muted)]">
                    Preview is not available for this file type.
                </div>
            ) : null}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] p-4">
                <div>
                    <p className="font-medium text-[var(--foreground)]">{attachment.fileName}</p>
                    <p className="text-xs text-[var(--muted)]">
                        {attachment.mimeType} · {formatFileSize(attachment.size)}
                    </p>
                </div>
                <Button
                    className="rounded-full"
                    onClick={onDownload}
                    type="button"
                    variant="outline"
                >
                    <Download className="size-4" />
                    Download
                </Button>
            </div>
        </Card>
    )
}
