import type { ProjectNodeDto } from "@shared/types/projects"
import { FileText, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"

import { Card } from "@/components/ui/card"
import { http } from "@/utils/api/http"

interface ProjectFilePreviewProps {
    downloadUrl: string
    node: ProjectNodeDto
}

export function ProjectFilePreview({ downloadUrl, node }: ProjectFilePreviewProps) {
    const [objectUrl, setObjectUrl] = useState<string | null>(null)
    const [previewLoading, setPreviewLoading] = useState(false)
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
            setPreviewLoading(false)
            return
        }

        let active = true
        let nextUrl: string | null = null

        setPreviewLoading(true)
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
            .finally(() => {
                if (active) {
                    setPreviewLoading(false)
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
        <Card className="flex min-h-0 flex-col overflow-hidden rounded-[24px] bg-[var(--surface)] lg:h-full">
            <div className="min-h-0 flex-1 overflow-auto">
                {previewLoading ? (
                    <div className="grid min-h-[280px] place-items-center gap-3 p-10 text-center text-sm text-[var(--muted)]">
                        <Loader2 className="size-8 animate-spin text-[var(--foreground)]" />
                        Loading preview...
                    </div>
                ) : null}
                {isImage && objectUrl ? (
                    <img
                        alt={node.name}
                        className="max-h-full w-full object-contain"
                        src={objectUrl}
                    />
                ) : null}
                {isVideo && objectUrl ? (
                    <video className="max-h-full w-full" controls src={objectUrl} />
                ) : null}
                {isAudio && objectUrl ? (
                    <div className="p-4">
                        <audio className="w-full" controls src={objectUrl} />
                    </div>
                ) : null}
                {isPdf && objectUrl ? (
                    <iframe className="h-full min-h-[520px] w-full" src={objectUrl} title={node.name} />
                ) : null}
                {isText && textPreview !== null ? (
                    <pre className="min-h-full whitespace-pre-wrap p-4 text-sm leading-6 text-[var(--foreground)]">
                        {textPreview}
                    </pre>
                ) : null}
                {!canPreview ? (
                    <div className="grid min-h-[280px] place-items-center gap-3 p-10 text-center text-sm text-[var(--muted)]">
                        <FileText className="size-10 text-[var(--foreground)]" />
                        Preview is not available for this file type yet.
                    </div>
                ) : null}
            </div>
        </Card>
    )
}
