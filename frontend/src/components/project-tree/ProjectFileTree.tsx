import type { ProjectNodeDto } from "@contracts/types/content"
import {
    Download,
    Eye,
    FileText,
    Folder,
    FolderPlus,
    PackageOpen,
    Pencil,
    Trash2,
    Upload,
} from "lucide-react"
import { useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"

import { projectsApi } from "@/api/ProjectsApi"
import { ProjectFilePreview } from "@/components/project-tree/ProjectFilePreview"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Modal } from "@/components/ui/modal"
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
import { queryKeys } from "@/queries/queryKeys"
import { formatFileSize } from "@/utils/format"

type ProjectTreeMode = "author" | "reader"

interface ProjectFileTreeProps {
    mode: ProjectTreeMode
    projectId: string
    rootNodeId: string
    slug?: string
}

export function ProjectFileTree({ mode, projectId, rootNodeId, slug = "" }: ProjectFileTreeProps) {
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(rootNodeId)
    const [deleteNodeTarget, setDeleteNodeTarget] = useState<ProjectNodeDto | null>(null)
    const [folderName, setFolderName] = useState("")
    const [folderModalOpen, setFolderModalOpen] = useState(false)
    const [bulkDownloadPending, setBulkDownloadPending] = useState(false)
    const [previewNode, setPreviewNode] = useState<ProjectNodeDto | null>(null)
    const [renameName, setRenameName] = useState("")
    const [renameNodeTarget, setRenameNodeTarget] = useState<ProjectNodeDto | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const folderInputRef = useRef<HTMLInputElement>(null)
    const queryClient = useQueryClient()
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
        const name = folderName.trim()
        if (!name) {
            return
        }
        await createFolderMutation.mutateAsync({
            name,
            parentId: currentFolderId,
            visibility: "published",
        })
        setFolderName("")
        setFolderModalOpen(false)
    }

    async function renameNode(node: ProjectNodeDto) {
        const name = renameName.trim()
        if (!name || name === node.name) {
            return
        }
        await updateNodeMutation.mutateAsync({ nodeId: node.id, input: { name } })
        setRenameName("")
        setRenameNodeTarget(null)
    }

    async function toggleVisibility(node: ProjectNodeDto) {
        await updateNodeMutation.mutateAsync({
            nodeId: node.id,
            input: { visibility: node.visibility === "published" ? "author" : "published" },
        })
    }

    async function deleteNode(node: ProjectNodeDto) {
        await deleteNodeMutation.mutateAsync(node.id)
        setDeleteNodeTarget(null)
    }

    async function downloadFile(node: ProjectNodeDto) {
        if (isAuthor) {
            await downloadMyFileMutation.mutateAsync({ nodeId: node.id, fileName: node.name })
            return
        }
        await downloadAuthorFileMutation.mutateAsync({ nodeId: node.id, fileName: node.name })
    }

    async function downloadFolder(folderId = currentFolderId) {
        setBulkDownloadPending(true)
        try {
            const bundle = isAuthor
                ? await projectsApi.getMyProjectBundle(projectId, folderId)
                : await projectsApi.getAuthorProjectBundle(slug, projectId, folderId)

            for (const file of bundle.files) {
                if (isAuthor) {
                    await projectsApi.downloadMyProjectFile(projectId, file.nodeId, file.path)
                } else {
                    await projectsApi.downloadAuthorProjectFile(
                        slug,
                        projectId,
                        file.nodeId,
                        file.path
                    )
                }
            }
        } finally {
            setBulkDownloadPending(false)
        }
    }

    async function uploadFiles(files: File[]) {
        await Promise.all(files.map((file) => uploadFileMutation.mutateAsync(file)))
    }

    async function uploadFolderFiles(files: File[]) {
        const folderIds = new Map<string, string | null>()
        folderIds.set("", currentFolderId)

        for (const file of files) {
            const relativePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath
            const pathParts = (relativePath || file.name).split("/").filter(Boolean)
            const fileName = pathParts.pop() ?? file.name
            let parentId = currentFolderId
            let pathKey = ""

            for (const segment of pathParts) {
                pathKey = pathKey ? `${pathKey}/${segment}` : segment
                if (!folderIds.has(pathKey)) {
                    const folder = await projectsApi.createMyProjectFolder(projectId, {
                        name: segment,
                        parentId,
                        visibility: "published",
                    })
                    folderIds.set(pathKey, folder.id)
                }
                parentId = folderIds.get(pathKey) ?? currentFolderId
            }

            const uploadFile = new File([file], fileName, { type: file.type })
            await projectsApi.uploadMyProjectFile(projectId, uploadFile, parentId)
        }

        await queryClient.invalidateQueries({
            queryKey: queryKeys.myProjectNodes(projectId, currentFolderId),
        })
        await queryClient.invalidateQueries({ queryKey: ["me", "projects"] })
        await queryClient.invalidateQueries({ queryKey: ["authors"] })
    }

    return (
        <Card className="mt-6 overflow-hidden">
            <CardHeader className="gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                    <CardTitle>Project files</CardTitle>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                        Browse, preview, upload, and download structured project files.
                    </p>
                </div>

                {isAuthor ? (
                    <div className="flex flex-wrap gap-2">
                        <Button
                            className="rounded-full"
                            onClick={() => setFolderModalOpen(true)}
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
                            Upload files
                        </Button>
                        <Button
                            className="rounded-full"
                            onClick={() => folderInputRef.current?.click()}
                            size="sm"
                            type="button"
                            variant="outline"
                        >
                            <Upload className="size-4" />
                            Upload folder
                        </Button>
                        <Input
                            className="hidden"
                            onChange={(event) => {
                                const files = Array.from(event.target.files ?? [])
                                if (files.length) {
                                    void uploadFiles(files)
                                }
                                event.currentTarget.value = ""
                            }}
                            multiple
                            ref={fileInputRef}
                            type="file"
                        />
                        <Input
                            className="hidden"
                            onChange={(event) => {
                                const files = Array.from(event.target.files ?? [])
                                if (files.length) {
                                    void uploadFolderFiles(files)
                                }
                                event.currentTarget.value = ""
                            }}
                            multiple
                            ref={folderInputRef}
                            type="file"
                            {...{ directory: "", webkitdirectory: "" }}
                        />
                    </div>
                ) : null}
            </CardHeader>

            <CardContent>
                <div className="mb-4 flex flex-wrap gap-2">
                    <Button
                        className="rounded-full"
                        disabled={bulkDownloadPending}
                        onClick={() => void downloadFolder()}
                        size="sm"
                        type="button"
                        variant="outline"
                    >
                        <PackageOpen className="size-4" />
                        {bulkDownloadPending ? "Downloading..." : "Download current folder"}
                    </Button>
                </div>
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
                                        <>
                                            <Button
                                                className="rounded-full"
                                                onClick={() => setPreviewNode(node)}
                                                size="sm"
                                                type="button"
                                                variant="outline"
                                            >
                                                <Eye className="size-4" />
                                                Preview
                                            </Button>
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
                                        </>
                                    ) : (
                                        <Button
                                            className="rounded-full"
                                            disabled={bulkDownloadPending}
                                            onClick={() => void downloadFolder(node.id)}
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
                                                onClick={() => {
                                                    setRenameNodeTarget(node)
                                                    setRenameName(node.name)
                                                }}
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
                                                onClick={() => setDeleteNodeTarget(node)}
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

            <Modal
                description="Create a folder inside the current project location."
                onOpenChange={setFolderModalOpen}
                open={folderModalOpen}
                title="New folder"
            >
                <form
                    className="grid gap-4"
                    onSubmit={(event) => {
                        event.preventDefault()
                        void createFolder()
                    }}
                >
                    <Input
                        autoFocus
                        onChange={(event) => setFolderName(event.target.value)}
                        placeholder="Folder name"
                        value={folderName}
                    />
                    <div className="flex justify-end gap-2">
                        <Button
                            onClick={() => setFolderModalOpen(false)}
                            type="button"
                            variant="outline"
                        >
                            Cancel
                        </Button>
                        <Button disabled={createFolderMutation.isPending} type="submit">
                            Create folder
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal
                description="Rename this project file or folder."
                onOpenChange={(open) => {
                    if (!open) {
                        setRenameNodeTarget(null)
                    }
                }}
                open={Boolean(renameNodeTarget)}
                title="Rename item"
            >
                <form
                    className="grid gap-4"
                    onSubmit={(event) => {
                        event.preventDefault()
                        if (renameNodeTarget) {
                            void renameNode(renameNodeTarget)
                        }
                    }}
                >
                    <Input
                        autoFocus
                        onChange={(event) => setRenameName(event.target.value)}
                        placeholder="New name"
                        value={renameName}
                    />
                    <div className="flex justify-end gap-2">
                        <Button
                            onClick={() => setRenameNodeTarget(null)}
                            type="button"
                            variant="outline"
                        >
                            Cancel
                        </Button>
                        <Button disabled={updateNodeMutation.isPending} type="submit">
                            Save name
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal
                description={
                    deleteNodeTarget
                        ? `This will delete "${deleteNodeTarget.name}" from the project.`
                        : undefined
                }
                onOpenChange={(open) => {
                    if (!open) {
                        setDeleteNodeTarget(null)
                    }
                }}
                open={Boolean(deleteNodeTarget)}
                title="Delete item?"
            >
                <div className="flex justify-end gap-2">
                    <Button
                        onClick={() => setDeleteNodeTarget(null)}
                        type="button"
                        variant="outline"
                    >
                        Cancel
                    </Button>
                    <Button
                        disabled={deleteNodeMutation.isPending}
                        onClick={() => {
                            if (deleteNodeTarget) {
                                void deleteNode(deleteNodeTarget)
                            }
                        }}
                        type="button"
                        variant="destructive"
                    >
                        Delete
                    </Button>
                </div>
            </Modal>

            <Modal
                className="max-w-5xl"
                onOpenChange={(open) => {
                    if (!open) {
                        setPreviewNode(null)
                    }
                }}
                open={Boolean(previewNode)}
                title="File preview"
            >
                {previewNode ? (
                    <ProjectFilePreview
                        downloadUrl={
                            isAuthor
                                ? `/me/project-files/download/${projectId}/${previewNode.id}`
                                : `/project-files/download/${slug}/${projectId}/${previewNode.id}`
                        }
                        node={previewNode}
                        onDownload={() => void downloadFile(previewNode)}
                    />
                ) : null}
            </Modal>
        </Card>
    )
}
