import type { PostAttachmentDto } from "@shared/types/posts"
import { Download, FileText } from "lucide-react"

import { formatFileSize } from "@/utils/format"

interface PostFileAttachmentButtonProps {
    attachment: PostAttachmentDto
    onDownload: () => void
}

export function PostFileAttachmentButton({
    attachment,
    onDownload,
}: PostFileAttachmentButtonProps) {
    return (
        <button
            className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 text-left transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
            onClick={onDownload}
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
    )
}
