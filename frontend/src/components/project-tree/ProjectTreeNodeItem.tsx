import { PROJECT_NODE_KIND } from "@shared/consts"
import type { ProjectNodeDto } from "@shared/types/projects"
import { ChevronRight, FileText, Folder, FolderOpen } from "lucide-react"

import { cn } from "@/utils/cn"
import { formatFileSize } from "@/utils/format"

interface ProjectTreeNodeItemProps {
    depth?: number
    expandedFolderIds: Set<string>
    isLoading: (folderId: string) => boolean
    node: ProjectNodeDto
    nodesByParent: Record<string, ProjectNodeDto[]>
    onSelectNode: (node: ProjectNodeDto) => void
    onToggleFolder: (folderId: string) => void
    selectedNodeId?: string | null
}

export function ProjectTreeNodeItem({
    depth = 0,
    expandedFolderIds,
    isLoading,
    node,
    nodesByParent,
    onSelectNode,
    onToggleFolder,
    selectedNodeId,
}: ProjectTreeNodeItemProps) {
    const isFolder = node.kind === PROJECT_NODE_KIND.FOLDER
    const isExpanded = expandedFolderIds.has(node.id)
    const children = nodesByParent[node.id] ?? []
    const isSelected = selectedNodeId === node.id

    return (
        <div>
            <div
                className={cn(
                    "group grid grid-cols-[auto_1fr] items-center gap-1 rounded-2xl px-2 py-1.5 transition",
                    isSelected
                        ? "bg-[var(--foreground)] text-[var(--background)]"
                        : "text-[var(--muted)] hover:bg-[var(--surface-strong)] hover:text-[var(--foreground)]"
                )}
                style={{ paddingLeft: `${depth * 14 + 8}px` }}
            >
                {isFolder ? (
                    <button
                        aria-label={isExpanded ? "Collapse folder" : "Expand folder"}
                        className="grid size-7 place-items-center rounded-full transition hover:bg-black/5 dark:hover:bg-white/10"
                        onClick={() => onToggleFolder(node.id)}
                        type="button"
                    >
                        <ChevronRight
                            className={cn(
                                "size-4 transition-transform",
                                isExpanded ? "rotate-90" : ""
                            )}
                        />
                    </button>
                ) : (
                    <span className="size-7" />
                )}

                <button
                    className="flex min-w-0 items-center gap-2 text-left"
                    onClick={() => onSelectNode(node)}
                    type="button"
                >
                    {isFolder ? (
                        isExpanded ? (
                            <FolderOpen className="size-4 shrink-0" />
                        ) : (
                            <Folder className="size-4 shrink-0" />
                        )
                    ) : (
                        <FileText className="size-4 shrink-0" />
                    )}
                    <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{node.name}</span>
                        {!isFolder && node.size ? (
                            <span className="block text-xs opacity-70">
                                {formatFileSize(node.size)}
                            </span>
                        ) : null}
                        {isFolder && isLoading(node.id) ? (
                            <span className="block text-xs opacity-70">Loading...</span>
                        ) : null}
                    </span>
                </button>
            </div>

            {isFolder && isExpanded ? (
                <div className="mt-1 grid gap-1">
                    {children.map((child) => (
                        <ProjectTreeNodeItem
                            depth={depth + 1}
                            expandedFolderIds={expandedFolderIds}
                            isLoading={isLoading}
                            key={child.id}
                            node={child}
                            nodesByParent={nodesByParent}
                            onSelectNode={onSelectNode}
                            onToggleFolder={onToggleFolder}
                            selectedNodeId={selectedNodeId}
                        />
                    ))}
                </div>
            ) : null}
        </div>
    )
}
