import { PROJECT_NODE_KIND } from "@shared/consts"
import type { ProjectNodeDto } from "@shared/types/projects"
import { useEffect, useRef, useState, type DragEvent } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { projectsApi } from "@/api/ProjectsApi"
import { CreateFolderModal } from "@/components/project-tree/CreateFolderModal"
import { DeleteNodeModal } from "@/components/project-tree/DeleteNodeModal"
import { PreviewNodeModal } from "@/components/project-tree/PreviewNodeModal"
import { ProjectBreadcrumbs } from "@/components/project-tree/ProjectBreadcrumbs"
import { ProjectTreeDetailsPanel } from "@/components/project-tree/ProjectTreeDetailsPanel"
import { ProjectTreeSidebar } from "@/components/project-tree/ProjectTreeSidebar"
import { ProjectTreeToolbar } from "@/components/project-tree/ProjectTreeToolbar"
import { RenameNodeModal } from "@/components/project-tree/RenameNodeModal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    useAuthorProjectNodesQuery,
    useCreateMyProjectFolderMutation,
    useDeleteMyProjectNodeMutation,
    useDownloadAuthorProjectFileMutation,
    useDownloadMyProjectFileMutation,
    useMyProjectNodesQuery,
    useUpdateMyProjectNodeMutation,
} from "@/queries/projects"
import { queryKeys } from "@/queries/queryKeys"
import type { ProjectFileTreeProps } from "@/types/projects"
import { formatFileSize } from "@/utils/format"

export function ProjectFileTree({
    mode,
    projectId,
    rootLabel = "Project files",
    rootNodeId,
    slug = "",
}: ProjectFileTreeProps) {
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(rootNodeId)
    const [deleteNodeTarget, setDeleteNodeTarget] = useState<ProjectNodeDto | null>(null)
    const [folderName, setFolderName] = useState("")
    const [folderModalOpen, setFolderModalOpen] = useState(false)
    const [bulkDownloadPending, setBulkDownloadPending] = useState(false)
    const [previewNode, setPreviewNode] = useState<ProjectNodeDto | null>(null)
    const [renameName, setRenameName] = useState("")
    const [renameNodeTarget, setRenameNodeTarget] = useState<ProjectNodeDto | null>(null)
    const [selectedNode, setSelectedNode] = useState<ProjectNodeDto | null>(null)
    const [isTreeDropActive, setIsTreeDropActive] = useState(false)
    const [lastBreadcrumbs, setLastBreadcrumbs] = useState<ProjectNodeDto[]>([])
    const [treeNodesByParent, setTreeNodesByParent] = useState<Record<string, ProjectNodeDto[]>>({})
    const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(
        () => new Set([rootNodeId])
    )
    const [loadingFolderIds, setLoadingFolderIds] = useState<Set<string>>(() => new Set())
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
    const updateNodeMutation = useUpdateMyProjectNodeMutation(projectId, currentFolderId)
    const deleteNodeMutation = useDeleteMyProjectNodeMutation(projectId, currentFolderId)
    const downloadMyFileMutation = useDownloadMyProjectFileMutation(projectId)
    const downloadAuthorFileMutation = useDownloadAuthorProjectFileMutation(slug, projectId)
    const folders = nodesQuery.data?.nodes.filter((node) => node.kind === "folder") ?? []
    const files = nodesQuery.data?.nodes.filter((node) => node.kind === "file") ?? []
    const orderedNodes = [...folders, ...files]
    const breadcrumbs = nodesQuery.data?.breadcrumbs ?? lastBreadcrumbs
    const currentFolder =
        breadcrumbs.find((breadcrumb) => breadcrumb.id === currentFolderId) ?? null
    const currentFolderSummary = nodesQuery.data?.currentFolderSummary ?? {
        fileCount: orderedNodes.filter((node) => node.kind === PROJECT_NODE_KIND.FILE).length,
        folderCount: orderedNodes.filter((node) => node.kind === PROJECT_NODE_KIND.FOLDER).length,
        totalSize: orderedNodes.reduce((sum, node) => sum + (node.size ?? 0), 0),
    }
    const selectedFileDownloadUrl =
        selectedNode?.kind === PROJECT_NODE_KIND.FILE
            ? isAuthor
                ? `/me/project-files/download/${projectId}/${selectedNode.id}`
                : `/project-files/download/${slug}/${projectId}/${selectedNode.id}`
            : ""

    useEffect(() => {
        setCurrentFolderId(rootNodeId)
        setSelectedNode(null)
        setTreeNodesByParent({})
        setExpandedFolderIds(new Set([rootNodeId]))
        setLoadingFolderIds(new Set())
        setLastBreadcrumbs([])
    }, [projectId, rootNodeId])

    useEffect(() => {
        if (!nodesQuery.data) {
            return
        }

        const folderId = nodesQuery.data.currentFolderId || currentFolderId || rootNodeId
        setLastBreadcrumbs(nodesQuery.data.breadcrumbs)
        setTreeNodesByParent((previous) => ({
            ...previous,
            [folderId]: nodesQuery.data.nodes,
        }))
    }, [currentFolderId, nodesQuery.data, rootNodeId])

    function openFolder(node: ProjectNodeDto) {
        setCurrentFolderId(node.id)
        setSelectedNode(null)
        setLastBreadcrumbs((current) => appendBreadcrumb(current, node))
        setExpandedFolderIds((previous) => new Set(previous).add(node.id))
        void loadFolderChildren(node.id)
    }

    function selectNode(node: ProjectNodeDto) {
        if (node.kind === PROJECT_NODE_KIND.FOLDER) {
            openFolder(node)
            return
        }
        setSelectedNode(node)
    }

    async function loadFolderChildren(folderId: string) {
        if (treeNodesByParent[folderId] || loadingFolderIds.has(folderId)) {
            return
        }

        setLoadingFolderIds((previous) => new Set(previous).add(folderId))
        try {
            const data = isAuthor
                ? await projectsApi.listMyProjectNodes(projectId, folderId)
                : await projectsApi.listAuthorProjectNodes(slug, projectId, folderId)
            setTreeNodesByParent((previous) => ({
                ...previous,
                [folderId]: data.nodes,
            }))
        } finally {
            setLoadingFolderIds((previous) => {
                const next = new Set(previous)
                next.delete(folderId)
                return next
            })
        }
    }

    async function createFolder() {
        const name = folderName.trim()
        if (!name) {
            return
        }
        await createFolderMutation.mutateAsync({
            name,
            parentId: currentFolderId,
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

    async function deleteNode(node: ProjectNodeDto) {
        await deleteNodeMutation.mutateAsync(node.id)
        if (selectedNode?.id === node.id) {
            setSelectedNode(null)
        }
        setDeleteNodeTarget(null)
    }

    async function invalidateProjectFileQueries() {
        await queryClient.invalidateQueries({
            queryKey: queryKeys.myProjectNodes(projectId, currentFolderId),
        })
        await queryClient.invalidateQueries({ queryKey: queryKeys.myProjects() })
        await queryClient.invalidateQueries({ queryKey: queryKeys.authors() })
    }

    async function downloadFile(node: ProjectNodeDto) {
        try {
            if (isAuthor) {
                await downloadMyFileMutation.mutateAsync({ nodeId: node.id, fileName: node.name })
                return
            }
            await downloadAuthorFileMutation.mutateAsync({ nodeId: node.id, fileName: node.name })
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "File download failed.")
        }
    }

    async function downloadFolder(folderId = currentFolderId) {
        setBulkDownloadPending(true)
        const toastId = toast.loading("Preparing archive...", { duration: Infinity })
        try {
            const folderName =
                currentFolder?.id === folderId
                    ? currentFolder.name
                    : findKnownNodeById(folderId ?? "", treeNodesByParent)?.name
            const fileName = `${sanitizeArchiveName(folderName || "project-files")}.zip`
            toast.loading("Downloading archive...", { duration: Infinity, id: toastId })

            if (isAuthor) {
                await projectsApi.downloadMyProjectFolderArchive(projectId, folderId, fileName)
            } else {
                await projectsApi.downloadAuthorProjectFolderArchive(slug, projectId, folderId, fileName)
            }

            toast.success("Archive download started.", { id: toastId })
        } catch (error) {
            const message = getFolderDownloadErrorMessage(error)
            toast[message === "This folder is empty." ? "info" : "error"](message, {
                id: toastId,
            })
        } finally {
            setBulkDownloadPending(false)
        }
    }

    async function uploadFiles(files: File[]) {
        if (!files.length) {
            return
        }

        const totalSize = files.reduce((sum, file) => sum + file.size, 0)
        const toastId = toast.loading(formatUploadProgress("Uploading", 0, totalSize, files.length), {
            duration: Infinity,
        })
        let completedBytes = 0

        try {
            for (const file of files) {
                await projectsApi.uploadMyProjectFile(projectId, file, currentFolderId, (event) => {
                    toast.loading(
                        formatUploadProgress(
                            "Uploading",
                            Math.min(totalSize, completedBytes + event.loaded),
                            totalSize,
                            files.length
                        ),
                        { duration: Infinity, id: toastId }
                    )
                })
                completedBytes += file.size
            }

            await invalidateProjectFileQueries()
            toast.success(`Uploaded ${formatUploadSummary(files.length, totalSize)}.`, {
                id: toastId,
            })
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "File upload failed.", {
                id: toastId,
            })
        }
    }

    async function uploadFolderFiles(files: File[]) {
        if (!files.length) {
            return
        }

        const totalSize = files.reduce((sum, file) => sum + file.size, 0)
        const toastId = toast.loading(
            formatUploadProgress("Uploading folder", 0, totalSize, files.length),
            { duration: Infinity }
        )
        let completedBytes = 0
        const folderIds = new Map<string, string | null>()
        folderIds.set("", currentFolderId)

        try {
            for (const file of files) {
                const relativePath = (file as File & { webkitRelativePath?: string })
                    .webkitRelativePath
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
                        })
                        folderIds.set(pathKey, folder.id)
                    }
                    parentId = folderIds.get(pathKey) ?? currentFolderId
                }

                const uploadFile = new File([file], fileName, { type: file.type })
                await projectsApi.uploadMyProjectFile(projectId, uploadFile, parentId, (event) => {
                    toast.loading(
                        formatUploadProgress(
                            "Uploading folder",
                            Math.min(totalSize, completedBytes + event.loaded),
                            totalSize,
                            files.length
                        ),
                        { duration: Infinity, id: toastId }
                    )
                })
                completedBytes += file.size
            }

            await invalidateProjectFileQueries()

            toast.success(`Uploaded folder with ${formatUploadSummary(files.length, totalSize)}.`, {
                id: toastId,
            })
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Folder upload failed.", {
                id: toastId,
            })
        }
    }

    function handleTreeDrag(event: DragEvent<HTMLElement>) {
        if (!isAuthor || !hasFileDrop(event.dataTransfer)) {
            return
        }
        event.preventDefault()
        event.dataTransfer.dropEffect = "copy"
    }

    async function handleTreeDrop(event: DragEvent<HTMLElement>) {
        if (!isAuthor || !hasFileDrop(event.dataTransfer)) {
            return
        }

        event.preventDefault()
        setIsTreeDropActive(false)

        try {
            const files = await getFilesFromDataTransfer(event.dataTransfer)
            if (!files.length) {
                toast.info("No files found in the dropped item.")
                return
            }

            if (files.some((file) => getRelativePath(file).includes("/"))) {
                await uploadFolderFiles(files)
                return
            }

            await uploadFiles(files)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Dropped files could not be read.")
        }
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
                    <ProjectTreeToolbar
                        fileInputRef={fileInputRef}
                        folderInputRef={folderInputRef}
                        onCreateFolder={() => setFolderModalOpen(true)}
                        onUploadFiles={(files) => void uploadFiles(files)}
                        onUploadFolderFiles={(files) => void uploadFolderFiles(files)}
                    />
                ) : null}
            </CardHeader>

            <CardContent>
                <ProjectBreadcrumbs
                    breadcrumbs={breadcrumbs}
                    currentFolderId={currentFolderId}
                    onOpenFolder={(folderId) => {
                        setCurrentFolderId(folderId)
                        setSelectedNode(null)
                        setLastBreadcrumbs((current) => trimBreadcrumbs(current, folderId))
                        setExpandedFolderIds((previous) => new Set(previous).add(folderId))
                    }}
                    rootLabel={rootLabel}
                />

                {nodesQuery.isError ? (
                    <p className="text-sm text-rose-600">
                        Failed to load project files: {nodesQuery.error.message}
                    </p>
                ) : (
                    <div className="grid min-h-[640px] gap-4 lg:max-h-[calc(100dvh-12rem)] lg:grid-cols-[minmax(260px,340px)_1fr]">
                        <ProjectTreeSidebar
                            currentFolderId={currentFolderId}
                            expandedFolderIds={expandedFolderIds}
                            isDropActive={isTreeDropActive}
                            nodesByParent={treeNodesByParent}
                            onDragEnter={(event) => {
                                handleTreeDrag(event)
                                if (isAuthor && hasFileDrop(event.dataTransfer)) {
                                    setIsTreeDropActive(true)
                                }
                            }}
                            onDragLeave={(event) => {
                                const nextTarget = event.relatedTarget
                                if (
                                    nextTarget instanceof Node &&
                                    event.currentTarget.contains(nextTarget)
                                ) {
                                    return
                                }
                                setIsTreeDropActive(false)
                            }}
                            onDragOver={handleTreeDrag}
                            onDrop={(event) => void handleTreeDrop(event)}
                            onSelectNode={selectNode}
                            rootNodeId={rootNodeId}
                            selectedNodeId={selectedNode?.id}
                        />
                        <ProjectTreeDetailsPanel
                            bulkDownloadPending={bulkDownloadPending}
                            currentFolder={currentFolder}
                            downloadUrl={selectedFileDownloadUrl}
                            isAuthor={isAuthor}
                            isLoading={nodesQuery.isLoading}
                            nodes={orderedNodes}
                            folderSummary={currentFolderSummary}
                            onDelete={setDeleteNodeTarget}
                            onDownloadFile={(target) => void downloadFile(target)}
                            onDownloadFolder={(folderId) => void downloadFolder(folderId)}
                            onOpenFolder={openFolder}
                            onPreview={setPreviewNode}
                            onRename={(target) => {
                                setRenameNodeTarget(target)
                                setRenameName(target.name)
                            }}
                            selectedNode={selectedNode}
                        />
                    </div>
                )}
            </CardContent>

            <CreateFolderModal
                folderName={folderName}
                isPending={createFolderMutation.isPending}
                onCreate={() => void createFolder()}
                onFolderNameChange={setFolderName}
                onOpenChange={setFolderModalOpen}
                open={folderModalOpen}
            />

            <RenameNodeModal
                isPending={updateNodeMutation.isPending}
                onOpenChange={(open) => {
                    if (!open) {
                        setRenameNodeTarget(null)
                    }
                }}
                onRename={() => {
                    if (renameNodeTarget) {
                        void renameNode(renameNodeTarget)
                    }
                }}
                onRenameNameChange={setRenameName}
                open={Boolean(renameNodeTarget)}
                renameName={renameName}
            />

            <DeleteNodeModal
                isPending={deleteNodeMutation.isPending}
                node={deleteNodeTarget}
                onDelete={() => {
                    if (deleteNodeTarget) {
                        void deleteNode(deleteNodeTarget)
                    }
                }}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeleteNodeTarget(null)
                    }
                }}
            />

            <PreviewNodeModal
                downloadUrl={
                    previewNode
                        ? isAuthor
                            ? `/me/project-files/download/${projectId}/${previewNode.id}`
                            : `/project-files/download/${slug}/${projectId}/${previewNode.id}`
                        : ""
                }
                node={previewNode}
                onOpenChange={(open) => {
                    if (!open) {
                        setPreviewNode(null)
                    }
                }}
            />
        </Card>
    )
}

type DataTransferItemWithEntry = DataTransferItem & {
    webkitGetAsEntry?: () => FileSystemEntry | null
}

function hasFileDrop(dataTransfer: DataTransfer) {
    return Array.from(dataTransfer.types).includes("Files")
}

async function getFilesFromDataTransfer(dataTransfer: DataTransfer) {
    const items = Array.from(dataTransfer.items ?? []) as DataTransferItemWithEntry[]
    const entries = items
        .map((item) => item.webkitGetAsEntry?.())
        .filter((entry): entry is FileSystemEntry => Boolean(entry))

    if (!entries.length) {
        return Array.from(dataTransfer.files ?? [])
    }

    const files = await Promise.all(entries.map((entry) => readDroppedEntry(entry)))
    return files.flat()
}

async function readDroppedEntry(entry: FileSystemEntry, parentPath = ""): Promise<File[]> {
    const relativePath = parentPath ? `${parentPath}/${entry.name}` : entry.name

    if (entry.isFile) {
        const file = await readDroppedFile(entry as FileSystemFileEntry)
        return [withRelativePath(file, relativePath)]
    }

    if (!entry.isDirectory) {
        return []
    }

    const reader = (entry as FileSystemDirectoryEntry).createReader()
    const childEntries = await readAllDirectoryEntries(reader)
    const files = await Promise.all(
        childEntries.map((childEntry) => readDroppedEntry(childEntry, relativePath))
    )
    return files.flat()
}

function readDroppedFile(entry: FileSystemFileEntry) {
    return new Promise<File>((resolve, reject) => {
        entry.file(resolve, reject)
    })
}

async function readAllDirectoryEntries(reader: FileSystemDirectoryReader) {
    const entries: FileSystemEntry[] = []

    while (true) {
        const batch = await new Promise<FileSystemEntry[]>((resolve, reject) => {
            reader.readEntries(resolve, reject)
        })
        if (!batch.length) {
            break
        }
        entries.push(...batch)
    }

    return entries
}

function withRelativePath(file: File, relativePath: string) {
    const nextFile = new File([file], file.name, {
        lastModified: file.lastModified,
        type: file.type,
    })
    Object.defineProperty(nextFile, "webkitRelativePath", {
        configurable: true,
        value: relativePath,
    })
    return nextFile
}

function getRelativePath(file: File) {
    return (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name
}

function formatUploadSummary(fileCount: number, totalSize: number) {
    return `${fileCount} file${fileCount === 1 ? "" : "s"} (${formatFileSize(totalSize)})`
}

function formatUploadProgress(
    label: string,
    loadedBytes: number,
    totalBytes: number,
    fileCount: number
) {
    return `${label} ${fileCount} file${fileCount === 1 ? "" : "s"} · ${formatFileSize(
        loadedBytes
    )} / ${formatFileSize(totalBytes)}`
}

function sanitizeArchiveName(name: string) {
    return name.trim().replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "") || "project-files"
}

function findKnownNodeById(nodeId: string, nodesByParent: Record<string, ProjectNodeDto[]>) {
    for (const nodes of Object.values(nodesByParent)) {
        const node = nodes.find((item) => item.id === nodeId)
        if (node) {
            return node
        }
    }
    return null
}

function getFolderDownloadErrorMessage(error: unknown) {
    const message = error instanceof Error ? error.message : ""
    if (/folder is empty/i.test(message)) {
        return "This folder is empty."
    }
    return message || "Folder download failed."
}

function appendBreadcrumb(breadcrumbs: ProjectNodeDto[], node: ProjectNodeDto) {
    const existingIndex = breadcrumbs.findIndex((breadcrumb) => breadcrumb.id === node.id)
    if (existingIndex >= 0) {
        return breadcrumbs.slice(0, existingIndex + 1)
    }
    return [...breadcrumbs, node]
}

function trimBreadcrumbs(breadcrumbs: ProjectNodeDto[], folderId: string) {
    const index = breadcrumbs.findIndex((breadcrumb) => breadcrumb.id === folderId)
    return index >= 0 ? breadcrumbs.slice(0, index + 1) : breadcrumbs
}
