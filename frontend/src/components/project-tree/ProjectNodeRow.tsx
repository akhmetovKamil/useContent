import type { ProjectNodeDto } from "@shared/types/content"
import { Download, Eye, FileText, Folder, PackageOpen, Pencil, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatFileSize } from "@/utils/format"

export function ProjectNodeRow({
    bulkDownloadPending,
    isAuthor,
    node,
    onDelete,
    onDownloadFile,
    onDownloadFolder,
    onOpenFolder,
    onPreview,
    onRename,
    onToggleVisibility,
}: {
    bulkDownloadPending: boolean
    isAuthor: boolean
    node: ProjectNodeDto
    onDelete: (node: ProjectNodeDto) => void
    onDownloadFile: (node: ProjectNodeDto) => void
    onDownloadFolder: (folderId: string) => void
    onOpenFolder: (node: ProjectNodeDto) => void
    onPreview: (node: ProjectNodeDto) => void
    onRename: (node: ProjectNodeDto) => void
    onToggleVisibility: (node: ProjectNodeDto) => void
}) {
    return (
        <div className="grid gap-3 border-b border-[var(--line)] bg-[var(--surface)] p-4 last:border-b-0 md:grid-cols-[1fr_auto]">
            <button
                className="flex min-w-0 items-center gap-3 text-left"
                disabled={node.kind !== "folder"}
                onClick={() => onOpenFolder(node)}
                type="button"
            >
                <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[var(--surface-strong)] text-[var(--foreground)]">
                    {node.kind === "folder" ? (
                        <Folder className="size-5" />
                    ) : (
                        <FileText className="size-5" />
                    )}
                </span>
                <span className="min-w-0">
                    <span className="block truncate font-medium text-[var(--foreground)]">
                        {node.name}
                    </span>
                    <span className="mt-1 flex flex-wrap gap-2 text-xs text-[var(--muted)]">
                        <span>{node.kind}</span>
                        {node.size ? <span>{formatFileSize(node.size)}</span> : null}
                        {node.mimeType ? <span>{node.mimeType}</span> : null}
                    </span>
                </span>
            </button>

            <div className="flex flex-wrap items-center gap-2 md:justify-end">
                <Badge>{node.visibility}</Badge>
                {node.kind === "file" ? (
                    <>
                        <Button
                            className="rounded-full"
                            onClick={() => onPreview(node)}
                            size="sm"
                            type="button"
                            variant="outline"
                        >
                            <Eye className="size-4" />
                            Preview
                        </Button>
                        <Button
                            className="rounded-full"
                            onClick={() => onDownloadFile(node)}
                            size="sm"
                            type="button"
                            variant="outline"
                        >
                            <Download className="size-4" />
                            Download
                        </Button>
                    </>
                ) : (
                    <Button
                        className="rounded-full"
                        disabled={bulkDownloadPending}
                        onClick={() => onDownloadFolder(node.id)}
                        size="sm"
                        type="button"
                        variant="outline"
                    >
                        <PackageOpen className="size-4" />
                        Download folder
                    </Button>
                )}
                {isAuthor ? (
                    <>
                        <Button
                            className="rounded-full"
                            onClick={() => onRename(node)}
                            size="sm"
                            type="button"
                            variant="outline"
                        >
                            <Pencil className="size-4" />
                            Rename
                        </Button>
                        <Button
                            className="rounded-full"
                            onClick={() => onToggleVisibility(node)}
                            size="sm"
                            type="button"
                            variant="outline"
                        >
                            {node.visibility === "published" ? "Make private" : "Publish"}
                        </Button>
                        <Button
                            className="rounded-full"
                            onClick={() => onDelete(node)}
                            size="sm"
                            type="button"
                            variant="destructive"
                        >
                            <Trash2 className="size-4" />
                            Delete
                        </Button>
                    </>
                ) : null}
            </div>
        </div>
    )
}
