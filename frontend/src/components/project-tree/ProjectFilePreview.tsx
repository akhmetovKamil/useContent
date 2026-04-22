import type { ProjectNodeDto } from "@shared/types/content"
import { Download, FileText } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { http } from "@/utils/api/http"
import { formatFileSize } from "@/utils/format"

interface ProjectFilePreviewProps {
    downloadUrl: string
    node: ProjectNodeDto
    onDownload: () => void
}

export function ProjectFilePreview({ downloadUrl, node, onDownload }: ProjectFilePreviewProps) {
    const [objectUrl, setObjectUrl] = useState<string | null>(null)
    const [textPreview, setTextPreview] = useState<string | null>(null)
    const mimeType = node.mimeType ?? ""
    const isImage = mimeType.startsWith("image/")
    const isVideo = mimeType.startsWith("video/")
    const isAudio = mimeType.startsWith("audio/")
    const isText = mimeType.startsWith("text/") || mimeType === "application/json"
    const isPdf = mimeType === "application/pdf"
    const canPreview = isImage || isVideo || isAudio || isText || isPdf

    useEffect(() => {
        setObjectUrl(null)
        setTextPreview(null)

        if (!canPreview) {
            return
        }

        let active = true
        let nextUrl: string | null = null

        http.get<Blob>(downloadUrl, { responseType: "blob" })
            .then(async (response) => {
                if (!active) {
                    return
                }

                if (isText) {
                    setTextPreview((await response.data.text()).slice(0, 12_000))
                    return
                }

                nextUrl = URL.createObjectURL(response.data)
                setObjectUrl(nextUrl)
            })
            .catch(() => {
                if (active) {
                    setObjectUrl(null)
                    setTextPreview(null)
                }
            })

        return () => {
            active = false
            if (nextUrl) {
                URL.revokeObjectURL(nextUrl)
            }
        }
    }, [canPreview, downloadUrl, isText])

    return (
        <Card className="overflow-hidden rounded-[24px] bg-[var(--surface)]">
            <div className="border-b border-[var(--line)] p-4">
                <p className="font-medium text-[var(--foreground)]">{node.name}</p>
                <p className="text-xs text-[var(--muted)]">
                    {node.mimeType ?? "Unknown type"} · {formatFileSize(node.size ?? 0)}
                </p>
            </div>

            {isImage && objectUrl ? (
                <img
                    alt={node.name}
                    className="max-h-[560px] w-full object-contain"
                    src={objectUrl}
                />
            ) : null}
            {isVideo && objectUrl ? <video className="w-full" controls src={objectUrl} /> : null}
            {isAudio && objectUrl ? (
                <div className="p-4">
                    <audio className="w-full" controls src={objectUrl} />
                </div>
            ) : null}
            {isPdf && objectUrl ? (
                <iframe className="h-[70vh] w-full" src={objectUrl} title={node.name} />
            ) : null}
            {isText && textPreview !== null ? (
                <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap p-4 text-sm leading-6 text-[var(--foreground)]">
                    {textPreview}
                </pre>
            ) : null}
            {!canPreview ? (
                <div className="grid place-items-center gap-3 p-10 text-center text-sm text-[var(--muted)]">
                    <FileText className="size-10 text-[var(--foreground)]" />
                    Preview is not available for this file type yet.
                </div>
            ) : null}

            <div className="flex justify-end border-t border-[var(--line)] p-4">
                <Button
                    className="rounded-full"
                    onClick={onDownload}
                    type="button"
                    variant="outline"
                >
                    <Download className="size-4" />
                    Download file
                </Button>
            </div>
        </Card>
    )
}
