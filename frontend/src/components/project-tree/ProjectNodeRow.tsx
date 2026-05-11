import type { ProjectNodeDto } from "@shared/types/projects"
import { Download, Eye, FileText, Folder, PackageOpen, Pencil, Trash2 } from "lucide-react"

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
}) {
    return (
        <div className="grid gap-3 border-b border-[var(--line)] bg-[var(--surface)] p-4 transition hover:bg-[var(--surface-strong)] last:border-b-0 md:grid-cols-[1fr_auto]">
            <button
                className="flex min-w-0 items-center gap-3 rounded-2xl text-left outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:cursor-default"
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
                        {node.size ? <span>{formatFileSize(node.size)}</span> : null}
                        {node.mimeType ? <span>{node.mimeType}</span> : null}
                    </span>
                </span>
            </button>

            <div className="flex flex-wrap items-center gap-2 md:justify-end">
                {node.kind === "file" ? (
                    <>
                        <Button
                            aria-label={`Preview ${node.name}`}
                            className="size-10 rounded-full p-0"
                            onClick={() => onPreview(node)}
                            size="sm"
                            title="Preview"
                            type="button"
                            variant="outline"
                        >
                            <Eye className="size-4" />
                        </Button>
                        <Button
                            aria-label={`Download ${node.name}`}
                            className="size-10 rounded-full p-0"
                            onClick={() => onDownloadFile(node)}
                            size="sm"
                            title="Download"
                            type="button"
                            variant="outline"
                        >
                            <Download className="size-4" />
                        </Button>
                    </>
                ) : (
                    <Button
                        aria-label={`Download folder ${node.name}`}
                        className="size-10 rounded-full p-0"
                        disabled={bulkDownloadPending}
                        onClick={() => onDownloadFolder(node.id)}
                        size="sm"
                        title="Download folder"
                        type="button"
                        variant="outline"
                    >
                        <PackageOpen className="size-4" />
                    </Button>
                )}
                {isAuthor ? (
                    <>
                        <Button
                            aria-label={`Rename ${node.name}`}
                            className="size-10 rounded-full p-0"
                            onClick={() => onRename(node)}
                            size="sm"
                            title="Rename"
                            type="button"
                            variant="outline"
                        >
                            <Pencil className="size-4" />
                        </Button>
                        <Button
                            aria-label={`Delete ${node.name}`}
                            className="size-10 rounded-full p-0"
                            onClick={() => onDelete(node)}
                            size="sm"
                            title="Delete"
                            type="button"
                            variant="destructive"
                        >
                            <Trash2 className="size-4" />
                        </Button>
                    </>
                ) : null}
            </div>
        </div>
    )
}
