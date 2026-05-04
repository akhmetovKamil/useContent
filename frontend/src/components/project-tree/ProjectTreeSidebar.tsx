import type { ProjectNodeDto } from "@shared/types/projects"
import { FolderOpen } from "lucide-react"

import { ProjectTreeNodeItem } from "@/components/project-tree/ProjectTreeNodeItem"
import { cn } from "@/utils/cn"

interface ProjectTreeSidebarProps {
    currentFolderId: string | null
    expandedFolderIds: Set<string>
    isLoadingFolder: (folderId: string) => boolean
    nodesByParent: Record<string, ProjectNodeDto[]>
    onOpenRoot: () => void
    onSelectNode: (node: ProjectNodeDto) => void
    onToggleFolder: (folderId: string) => void
    rootNodeId: string
    selectedNodeId?: string | null
}

export function ProjectTreeSidebar({
    currentFolderId,
    expandedFolderIds,
    isLoadingFolder,
    nodesByParent,
    onOpenRoot,
    onSelectNode,
    onToggleFolder,
    rootNodeId,
    selectedNodeId,
}: ProjectTreeSidebarProps) {
    const rootChildren = nodesByParent[rootNodeId] ?? []
    const rootSelected = !selectedNodeId && currentFolderId === rootNodeId

    return (
        <aside className="rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-3 lg:sticky lg:top-4 lg:max-h-[76vh] lg:overflow-auto">
            <button
                className={cn(
                    "mb-2 flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm font-semibold transition",
                    rootSelected
                        ? "bg-[var(--foreground)] text-[var(--background)]"
                        : "text-[var(--foreground)] hover:bg-[var(--surface-strong)]"
                )}
                onClick={onOpenRoot}
                type="button"
            >
                <FolderOpen className="size-4" />
                root
            </button>

            {rootChildren.length ? (
                <div className="grid gap-1">
                    {rootChildren.map((node) => (
                        <ProjectTreeNodeItem
                            expandedFolderIds={expandedFolderIds}
                            isLoading={isLoadingFolder}
                            key={node.id}
                            node={node}
                            nodesByParent={nodesByParent}
                            onSelectNode={onSelectNode}
                            onToggleFolder={onToggleFolder}
                            selectedNodeId={selectedNodeId ?? currentFolderId}
                        />
                    ))}
                </div>
            ) : (
                <p className="rounded-2xl border border-dashed border-[var(--line)] p-4 text-sm text-[var(--muted)]">
                    No files loaded yet.
                </p>
            )}
        </aside>
    )
}
