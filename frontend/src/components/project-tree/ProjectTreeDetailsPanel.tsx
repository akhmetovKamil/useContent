import { PROJECT_NODE_KIND } from "@shared/consts"
import type { ProjectNodeDto, ProjectNodeSummaryDto } from "@shared/types/projects"
import { Download, FileText, Folder, FolderOpen, HardDrive, ListTree, PackageOpen } from "lucide-react"

import { ProjectFilePreview } from "@/components/project-tree/ProjectFilePreview"
import { ProjectNodeRow } from "@/components/project-tree/ProjectNodeRow"
import { Button } from "@/components/ui/button"
import { formatFileSize } from "@/utils/format"

interface ProjectTreeDetailsPanelProps {
    bulkDownloadPending: boolean
    currentFolder: ProjectNodeDto | null
    downloadUrl: string
    isAuthor: boolean
    isLoading: boolean
    nodes: ProjectNodeDto[]
    folderSummary: ProjectNodeSummaryDto
    onDelete: (node: ProjectNodeDto) => void
    onDownloadFile: (node: ProjectNodeDto) => void
    onDownloadFolder: (folderId?: string | null) => void
    onOpenFolder: (node: ProjectNodeDto) => void
    onPreview: (node: ProjectNodeDto) => void
    onRename: (node: ProjectNodeDto) => void
    selectedNode: ProjectNodeDto | null
}

export function ProjectTreeDetailsPanel({
    bulkDownloadPending,
    currentFolder,
    downloadUrl,
    isAuthor,
    isLoading,
    nodes,
    folderSummary,
    onDelete,
    onDownloadFile,
    onDownloadFolder,
    onOpenFolder,
    onPreview,
    onRename,
    selectedNode,
}: ProjectTreeDetailsPanelProps) {
    if (selectedNode?.kind === PROJECT_NODE_KIND.FILE) {
        return (
            <section className="grid min-h-0 gap-4 lg:h-full lg:overflow-hidden">
                <div className="rounded-[24px] border border-[var(--line)] bg-[var(--surface)] px-4 py-3">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="flex min-w-0 items-center gap-3">
                            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[var(--surface-strong)] text-[var(--foreground)]">
                                <FileText className="size-5" />
                            </span>
                            <div className="min-w-0">
                                <h3 className="truncate text-lg font-semibold text-[var(--foreground)]">
                                    {selectedNode.name}
                                </h3>
                                <p className="truncate text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                                    {selectedNode.mimeType ?? "unknown type"} ·{" "}
                                    {formatFileSize(selectedNode.size ?? 0)}
                                </p>
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
                />
            </section>
        )
    }

    return (
        <section className="min-h-0 rounded-[28px] border border-[var(--line)] bg-[var(--surface)] lg:h-full lg:overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-[var(--line)] px-4 py-3 md:flex-row md:items-center md:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[var(--surface-strong)] text-[var(--foreground)]">
                        <FolderOpen className="size-5" />
                    </span>
                    <div className="min-w-0">
                        <h3 className="truncate text-lg font-semibold text-[var(--foreground)]">
                            {currentFolder ? currentFolder.name : "Project files"}
                        </h3>
                        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--muted)]">
                            <span className="inline-flex items-center gap-1.5">
                                <ListTree className="size-4" />
                                {folderSummary.fileCount} file
                                {folderSummary.fileCount === 1 ? "" : "s"}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <Folder className="size-4" />
                                {folderSummary.folderCount} folder
                                {folderSummary.folderCount === 1 ? "" : "s"}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <HardDrive className="size-4" />
                                {formatFileSize(folderSummary.totalSize)}
                            </span>
                        </p>
                    </div>
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

            <div className="min-h-0 p-4 lg:h-[calc(100%-4.5rem)] lg:overflow-auto">
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
