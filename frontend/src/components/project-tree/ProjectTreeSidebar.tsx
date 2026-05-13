import type { ProjectNodeDto } from "@shared/types/projects"
import { Folder, FolderOpen } from "lucide-react"
import type { DragEventHandler } from "react"

import { Tree, type TreeViewElement } from "@/components/ui/file-tree"
import { cn } from "@/utils/cn"

interface ProjectTreeSidebarProps {
    currentFolderId: string | null
    isDropActive?: boolean
    expandedFolderIds: Set<string>
    nodesByParent: Record<string, ProjectNodeDto[]>
    onDragEnter?: DragEventHandler<HTMLElement>
    onDragLeave?: DragEventHandler<HTMLElement>
    onDragOver?: DragEventHandler<HTMLElement>
    onDrop?: DragEventHandler<HTMLElement>
    onSelectNode: (node: ProjectNodeDto) => void
    rootNodeId: string
    selectedNodeId?: string | null
}

export function ProjectTreeSidebar({
    currentFolderId,
    isDropActive,
    expandedFolderIds,
    nodesByParent,
    onDragEnter,
    onDragLeave,
    onDragOver,
    onDrop,
    onSelectNode,
    rootNodeId,
    selectedNodeId,
}: ProjectTreeSidebarProps) {
    const rootChildren = nodesByParent[rootNodeId] ?? []
    const treeElements = buildTreeElements(rootChildren, nodesByParent)

    return (
        <aside
            className={cn(
                "min-h-0 rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-3 transition-colors lg:h-full lg:overflow-hidden",
                isDropActive
                    ? "border-[var(--accent)] bg-[var(--accent-soft)] shadow-[inset_0_0_0_1px_var(--accent)]"
                    : ""
            )}
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDragOver={onDragOver}
            onDrop={onDrop}
        >
            {treeElements.length ? (
                <Tree
                    className="h-full min-h-[260px] overflow-hidden rounded-2xl bg-[var(--surface)] p-1"
                    closeIcon={<Folder className="size-4" />}
                    elements={treeElements}
                    initialExpandedItems={[...expandedFolderIds]}
                    initialSelectedId={selectedNodeId ?? currentFolderId ?? rootNodeId}
                    onSelect={(nodeId) => {
                        const node = findNodeById(nodeId, nodesByParent)
                        if (!node) {
                            return
                        }
                        onSelectNode(node)
                    }}
                    openIcon={<FolderOpen className="size-4" />}
                />
            ) : (
                <p className="rounded-2xl border border-dashed border-[var(--line)] p-4 text-sm text-[var(--muted)]">
                    {isDropActive ? "Drop files or folders to upload." : "No files loaded yet."}
                </p>
            )}
        </aside>
    )
}

function buildTreeElements(
    nodes: ProjectNodeDto[],
    nodesByParent: Record<string, ProjectNodeDto[]>
): TreeViewElement[] {
    return nodes.map((node) => ({
        children:
            node.kind === "folder"
                ? buildTreeElements(nodesByParent[node.id] ?? [], nodesByParent)
                : undefined,
        id: node.id,
        isSelectable: true,
        name:
            node.kind === "folder" || !node.size
                ? node.name
                : `${node.name} · ${formatCompactSize(node.size)}`,
        type: node.kind,
    }))
}

function findNodeById(nodeId: string, nodesByParent: Record<string, ProjectNodeDto[]>) {
    for (const nodes of Object.values(nodesByParent)) {
        const match = nodes.find((node) => node.id === nodeId)
        if (match) {
            return match
        }
    }
    return null
}

function formatCompactSize(size: number) {
    if (size < 1024) {
        return `${size} B`
    }
    if (size < 1024 * 1024) {
        return `${Math.round(size / 1024)} KB`
    }
    return `${(size / 1024 / 1024).toFixed(1)} MB`
}
