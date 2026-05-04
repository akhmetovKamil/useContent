import type { ProjectNodeDto } from "@shared/types/projects"
import { Folder, FolderOpen } from "lucide-react"

import { Tree, type TreeViewElement } from "@/components/ui/file-tree"

interface ProjectTreeSidebarProps {
    currentFolderId: string | null
    expandedFolderIds: Set<string>
    nodesByParent: Record<string, ProjectNodeDto[]>
    onOpenRoot: () => void
    onSelectNode: (node: ProjectNodeDto) => void
    rootNodeId: string
    selectedNodeId?: string | null
}

export function ProjectTreeSidebar({
    currentFolderId,
    expandedFolderIds,
    nodesByParent,
    onOpenRoot,
    onSelectNode,
    rootNodeId,
    selectedNodeId,
}: ProjectTreeSidebarProps) {
    const rootChildren = nodesByParent[rootNodeId] ?? []
    const treeElements = buildTreeElements(rootChildren, nodesByParent)

    return (
        <aside className="rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-3 lg:sticky lg:top-4 lg:max-h-[76vh] lg:overflow-auto">
            <button
                className="mb-3 flex w-full items-center gap-2 rounded-2xl bg-[var(--surface-strong)] px-3 py-2 text-left text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--foreground)] hover:text-[var(--background)]"
                onClick={onOpenRoot}
                type="button"
            >
                <FolderOpen className="size-4" />
                root
            </button>

            {treeElements.length ? (
                <Tree
                    className="h-auto min-h-[220px] overflow-hidden rounded-2xl bg-[var(--surface)] p-1"
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
                    No files loaded yet.
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
