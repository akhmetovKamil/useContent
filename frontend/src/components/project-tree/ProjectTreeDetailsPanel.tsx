import { PROJECT_NODE_KIND } from "@shared/consts"
import type { ProjectNodeDto } from "@shared/types/projects"
import { Download, FileText, FolderOpen, PackageOpen } from "lucide-react"

import { ProjectFilePreview } from "@/components/project-tree/ProjectFilePreview"
import { ProjectNodeRow } from "@/components/project-tree/ProjectNodeRow"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatFileSize } from "@/utils/format"

interface ProjectTreeDetailsPanelProps {
    bulkDownloadPending: boolean
    currentFolder: ProjectNodeDto | null
    downloadUrl: string
    isAuthor: boolean
    isLoading: boolean
    nodes: ProjectNodeDto[]
    onDelete: (node: ProjectNodeDto) => void
    onDownloadFile: (node: ProjectNodeDto) => void
    onDownloadFolder: (folderId?: string | null) => void
    onOpenFolder: (node: ProjectNodeDto) => void
    onPreview: (node: ProjectNodeDto) => void
    onRename: (node: ProjectNodeDto) => void
    onToggleVisibility: (node: ProjectNodeDto) => void
    selectedNode: ProjectNodeDto | null
}

export function ProjectTreeDetailsPanel({
    bulkDownloadPending,
    currentFolder,
    downloadUrl,
    isAuthor,
    isLoading,
    nodes,
    onDelete,
    onDownloadFile,
    onDownloadFolder,
    onOpenFolder,
    onPreview,
    onRename,
    onToggleVisibility,
    selectedNode,
}: ProjectTreeDetailsPanelProps) {
    if (selectedNode?.kind === PROJECT_NODE_KIND.FILE) {
        return (
            <section className="grid gap-4">
                <div className="rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--muted)]">
                                <FileText className="size-4" />
                                selected file
                            </div>
                            <h3 className="mt-2 truncate text-2xl font-semibold text-[var(--foreground)]">
                                {selectedNode.name}
                            </h3>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <Badge>{selectedNode.visibility}</Badge>
                                <Badge variant="default">
                                    {selectedNode.mimeType ?? "unknown type"}
                                </Badge>
                                <Badge variant="default">
                                    {formatFileSize(selectedNode.size ?? 0)}
                                </Badge>
                            </div>
                        </div>
                        <Button
                            className="w-fit rounded-full"
                            onClick={() => onDownloadFile(selectedNode)}
                            type="button"
                            variant="outline"
                        >
                            <Download className="size-4" />
                            Download file
                        </Button>
                    </div>
                </div>

                <ProjectFilePreview
                    downloadUrl={downloadUrl}
                    node={selectedNode}
                    onDownload={() => onDownloadFile(selectedNode)}
                />
            </section>
        )
    }

    return (
        <section className="rounded-[28px] border border-[var(--line)] bg-[var(--surface)]">
            <div className="flex flex-col gap-4 border-b border-[var(--line)] p-5 md:flex-row md:items-start md:justify-between">
                <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-[var(--muted)]">
                        <FolderOpen className="size-4" />
                        selected folder
                    </div>
                    <h3 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
                        {currentFolder ? currentFolder.name : "root"}
                    </h3>
                    <p className="mt-2 text-sm text-[var(--muted)]">
                        {nodes.length} item{nodes.length === 1 ? "" : "s"} in this folder.
                    </p>
                </div>
                <Button
                    className="w-fit rounded-full"
                    disabled={bulkDownloadPending}
                    onClick={() => onDownloadFolder(currentFolder?.id)}
                    size="sm"
                    type="button"
                    variant="outline"
                >
                    <PackageOpen className="size-4" />
                    {bulkDownloadPending ? "Downloading..." : "Download folder"}
                </Button>
            </div>

            <div className="p-4">
                {isLoading ? (
                    <p className="text-sm text-[var(--muted)]">Loading files...</p>
                ) : nodes.length ? (
                    <div className="overflow-hidden rounded-2xl border border-[var(--line)]">
                        {nodes.map((node) => (
                            <ProjectNodeRow
                                bulkDownloadPending={bulkDownloadPending}
                                isAuthor={isAuthor}
                                key={node.id}
                                node={node}
                                onDelete={onDelete}
                                onDownloadFile={onDownloadFile}
                                onDownloadFolder={(folderId) => onDownloadFolder(folderId)}
                                onOpenFolder={onOpenFolder}
                                onPreview={onPreview}
                                onRename={onRename}
                                onToggleVisibility={onToggleVisibility}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="rounded-2xl border border-dashed border-[var(--line)] p-6 text-sm text-[var(--muted)]">
                        This folder is empty.
                    </div>
                )}
            </div>
        </section>
    )
}
