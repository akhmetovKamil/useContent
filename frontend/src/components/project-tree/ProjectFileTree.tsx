import type { ProjectNodeDto } from "@contracts/types/content"
import { Download, FileText, Folder, FolderPlus, Pencil, Trash2, Upload } from "lucide-react"
import { useRef, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    useAuthorProjectNodesQuery,
    useCreateMyProjectFolderMutation,
    useDeleteMyProjectNodeMutation,
    useDownloadAuthorProjectFileMutation,
    useDownloadMyProjectFileMutation,
    useMyProjectNodesQuery,
    useUpdateMyProjectNodeMutation,
    useUploadMyProjectFileMutation,
} from "@/queries/projects"

type ProjectTreeMode = "author" | "reader"

interface ProjectFileTreeProps {
    mode: ProjectTreeMode
    projectId: string
    rootNodeId: string
    slug?: string
}

export function ProjectFileTree({ mode, projectId, rootNodeId, slug = "" }: ProjectFileTreeProps) {
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(rootNodeId)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const isAuthor = mode === "author"
    const myNodesQuery = useMyProjectNodesQuery(
        projectId,
        isAuthor ? currentFolderId : null,
        isAuthor
    )
    const authorNodesQuery = useAuthorProjectNodesQuery(
        slug,
        projectId,
        isAuthor ? null : currentFolderId,
        !isAuthor
    )
    const nodesQuery = isAuthor ? myNodesQuery : authorNodesQuery
    const createFolderMutation = useCreateMyProjectFolderMutation(projectId, currentFolderId)
    const uploadFileMutation = useUploadMyProjectFileMutation(projectId, currentFolderId)
    const updateNodeMutation = useUpdateMyProjectNodeMutation(projectId, currentFolderId)
    const deleteNodeMutation = useDeleteMyProjectNodeMutation(projectId, currentFolderId)
    const downloadMyFileMutation = useDownloadMyProjectFileMutation(projectId)
    const downloadAuthorFileMutation = useDownloadAuthorProjectFileMutation(slug, projectId)
    const folders = nodesQuery.data?.nodes.filter((node) => node.kind === "folder") ?? []
    const files = nodesQuery.data?.nodes.filter((node) => node.kind === "file") ?? []
    const orderedNodes = [...folders, ...files]

    function openFolder(node: ProjectNodeDto) {
        setCurrentFolderId(node.id)
    }

    async function createFolder() {
        const name = window.prompt("Folder name")
        if (!name) {
            return
        }
        await createFolderMutation.mutateAsync({
            name,
            parentId: currentFolderId,
            visibility: "published",
        })
    }

    async function renameNode(node: ProjectNodeDto) {
        const name = window.prompt("New name", node.name)
        if (!name || name === node.name) {
            return
        }
        await updateNodeMutation.mutateAsync({ nodeId: node.id, input: { name } })
    }

    async function toggleVisibility(node: ProjectNodeDto) {
        await updateNodeMutation.mutateAsync({
            nodeId: node.id,
            input: { visibility: node.visibility === "published" ? "author" : "published" },
        })
    }

    async function deleteNode(node: ProjectNodeDto) {
        if (!window.confirm(`Delete ${node.name}?`)) {
            return
        }
        await deleteNodeMutation.mutateAsync(node.id)
    }

    async function downloadFile(node: ProjectNodeDto) {
        if (isAuthor) {
            await downloadMyFileMutation.mutateAsync({ nodeId: node.id, fileName: node.name })
            return
        }
        await downloadAuthorFileMutation.mutateAsync({ nodeId: node.id, fileName: node.name })
    }

    return (
        <Card className="mt-6 overflow-hidden">
            <CardHeader className="gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                    <CardTitle>Project files</CardTitle>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                        Browse folders and files inside this project. Folder downloads and previews
                        will be added after the core upload flow is stable.
                    </p>
                </div>

                {isAuthor ? (
                    <div className="flex flex-wrap gap-2">
                        <Button
                            className="rounded-full"
                            onClick={() => void createFolder()}
                            size="sm"
                            type="button"
                            variant="outline"
                        >
                            <FolderPlus className="size-4" />
                            New folder
                        </Button>
                        <Button
                            className="rounded-full"
                            onClick={() => fileInputRef.current?.click()}
                            size="sm"
                            type="button"
                        >
                            <Upload className="size-4" />
                            Upload file
                        </Button>
                        <Input
                            className="hidden"
                            onChange={(event) => {
                                const file = event.target.files?.[0]
                                if (file) {
                                    void uploadFileMutation.mutateAsync(file)
                                }
                                event.currentTarget.value = ""
                            }}
                            ref={fileInputRef}
                            type="file"
                        />
                    </div>
                ) : null}
            </CardHeader>

            <CardContent>
                <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-[var(--muted)]">
                    {nodesQuery.data?.breadcrumbs.map((breadcrumb, index) => (
                        <Button
                            className="h-8 rounded-full px-3"
                            key={breadcrumb.id}
                            onClick={() => setCurrentFolderId(breadcrumb.id)}
                            type="button"
                            variant={breadcrumb.id === currentFolderId ? "default" : "outline"}
                        >
                            {index === 0 ? "Root" : breadcrumb.name}
                        </Button>
                    ))}
                </div>

                {nodesQuery.isLoading ? (
                    <p className="text-sm text-[var(--muted)]">Loading files...</p>
                ) : nodesQuery.isError ? (
                    <p className="text-sm text-rose-600">
                        Failed to load project files: {nodesQuery.error.message}
                    </p>
                ) : orderedNodes.length ? (
                    <div className="overflow-hidden rounded-2xl border border-[var(--line)]">
                        {orderedNodes.map((node) => (
                            <div
                                className="grid gap-3 border-b border-[var(--line)] bg-[var(--surface)] p-4 last:border-b-0 md:grid-cols-[1fr_auto]"
                                key={node.id}
                            >
                                <button
                                    className="flex min-w-0 items-center gap-3 text-left"
                                    disabled={node.kind !== "folder"}
                                    onClick={() => openFolder(node)}
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
                                            {node.size ? (
                                                <span>{formatFileSize(node.size)}</span>
                                            ) : null}
                                            {node.mimeType ? <span>{node.mimeType}</span> : null}
                                        </span>
                                    </span>
                                </button>

                                <div className="flex flex-wrap items-center gap-2 md:justify-end">
                                    <Badge>{node.visibility}</Badge>
                                    {node.kind === "file" ? (
                                        <Button
                                            className="rounded-full"
                                            onClick={() => void downloadFile(node)}
                                            size="sm"
                                            type="button"
                                            variant="outline"
                                        >
                                            <Download className="size-4" />
                                            Download
                                        </Button>
                                    ) : null}
                                    {isAuthor ? (
                                        <>
                                            <Button
                                                className="rounded-full"
                                                onClick={() => void renameNode(node)}
                                                size="sm"
                                                type="button"
                                                variant="outline"
                                            >
                                                <Pencil className="size-4" />
                                                Rename
                                            </Button>
                                            <Button
                                                className="rounded-full"
                                                onClick={() => void toggleVisibility(node)}
                                                size="sm"
                                                type="button"
                                                variant="outline"
                                            >
                                                {node.visibility === "published"
                                                    ? "Make private"
                                                    : "Publish"}
                                            </Button>
                                            <Button
                                                className="rounded-full"
                                                onClick={() => void deleteNode(node)}
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
                        ))}
                    </div>
                ) : (
                    <div className="rounded-2xl border border-dashed border-[var(--line)] p-6 text-sm text-[var(--muted)]">
                        This folder is empty.
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function formatFileSize(size: number) {
    if (size < 1024) {
        return `${size} B`
    }
    if (size < 1024 * 1024) {
        return `${(size / 1024).toFixed(1)} KB`
    }
    return `${(size / 1024 / 1024).toFixed(1)} MB`
}
