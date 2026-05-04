import { CONTENT_VISIBILITY, PROJECT_NODE_KIND } from "@shared/consts"
import type { ProjectNodeDto } from "@shared/types/projects"
import { useEffect, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"

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
    useUploadMyProjectFileMutation,
} from "@/queries/projects"
import { queryKeys } from "@/queries/queryKeys"
import type { ProjectFileTreeProps } from "@/types/projects"

export function ProjectFileTree({ mode, projectId, rootNodeId, slug = "" }: ProjectFileTreeProps) {
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(rootNodeId)
    const [deleteNodeTarget, setDeleteNodeTarget] = useState<ProjectNodeDto | null>(null)
    const [folderName, setFolderName] = useState("")
    const [folderModalOpen, setFolderModalOpen] = useState(false)
    const [bulkDownloadPending, setBulkDownloadPending] = useState(false)
    const [previewNode, setPreviewNode] = useState<ProjectNodeDto | null>(null)
    const [renameName, setRenameName] = useState("")
    const [renameNodeTarget, setRenameNodeTarget] = useState<ProjectNodeDto | null>(null)
    const [selectedNode, setSelectedNode] = useState<ProjectNodeDto | null>(null)
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
    const uploadFileMutation = useUploadMyProjectFileMutation(projectId, currentFolderId)
    const updateNodeMutation = useUpdateMyProjectNodeMutation(projectId, currentFolderId)
    const deleteNodeMutation = useDeleteMyProjectNodeMutation(projectId, currentFolderId)
    const downloadMyFileMutation = useDownloadMyProjectFileMutation(projectId)
    const downloadAuthorFileMutation = useDownloadAuthorProjectFileMutation(slug, projectId)
    const folders = nodesQuery.data?.nodes.filter((node) => node.kind === "folder") ?? []
    const files = nodesQuery.data?.nodes.filter((node) => node.kind === "file") ?? []
    const orderedNodes = [...folders, ...files]
    const currentFolder =
        nodesQuery.data?.breadcrumbs.find((breadcrumb) => breadcrumb.id === currentFolderId) ?? null
    const selectedFileDownloadUrl =
        selectedNode?.kind === PROJECT_NODE_KIND.FILE
            ? isAuthor
                ? `/me/project-files/download/${projectId}/${selectedNode.id}`
                : `/project-files/download/${slug}/${projectId}/${selectedNode.id}`
            : ""

    useEffect(() => {
        if (!nodesQuery.data) {
            return
        }

        const folderId = nodesQuery.data.currentFolderId || currentFolderId || rootNodeId
        setTreeNodesByParent((previous) => ({
            ...previous,
            [folderId]: nodesQuery.data.nodes,
        }))
    }, [currentFolderId, nodesQuery.data, rootNodeId])

    function openFolder(node: ProjectNodeDto) {
        setCurrentFolderId(node.id)
        setSelectedNode(null)
        setExpandedFolderIds((previous) => new Set(previous).add(node.id))
        void loadFolderChildren(node.id)
    }

    function openRoot() {
        setCurrentFolderId(rootNodeId)
        setSelectedNode(null)
        setExpandedFolderIds((previous) => new Set(previous).add(rootNodeId))
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
            visibility: CONTENT_VISIBILITY.PUBLISHED,
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
            input: {
                visibility:
                    node.visibility === CONTENT_VISIBILITY.PUBLISHED
                        ? CONTENT_VISIBILITY.AUTHOR
                        : CONTENT_VISIBILITY.PUBLISHED,
            },
        })
    }

    async function deleteNode(node: ProjectNodeDto) {
        await deleteNodeMutation.mutateAsync(node.id)
        if (selectedNode?.id === node.id) {
            setSelectedNode(null)
        }
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
                        visibility: CONTENT_VISIBILITY.PUBLISHED,
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
                    breadcrumbs={nodesQuery.data?.breadcrumbs ?? []}
                    currentFolderId={currentFolderId}
                    onOpenFolder={(folderId) => {
                        setCurrentFolderId(folderId)
                        setSelectedNode(null)
                        setExpandedFolderIds((previous) => new Set(previous).add(folderId))
                    }}
                />

                {nodesQuery.isError ? (
                    <p className="text-sm text-rose-600">
                        Failed to load project files: {nodesQuery.error.message}
                    </p>
                ) : (
                    <div className="grid gap-4 lg:grid-cols-[minmax(240px,320px)_1fr]">
                        <ProjectTreeSidebar
                            currentFolderId={currentFolderId}
                            expandedFolderIds={expandedFolderIds}
                            nodesByParent={treeNodesByParent}
                            onOpenRoot={openRoot}
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
                            onDelete={setDeleteNodeTarget}
                            onDownloadFile={(target) => void downloadFile(target)}
                            onDownloadFolder={(folderId) => void downloadFolder(folderId)}
                            onOpenFolder={openFolder}
                            onPreview={setPreviewNode}
                            onRename={(target) => {
                                setRenameNodeTarget(target)
                                setRenameName(target.name)
                            }}
                            onToggleVisibility={(target) => void toggleVisibility(target)}
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
                onDownload={() => {
                    if (previewNode) {
                        void downloadFile(previewNode)
                    }
                }}
                onOpenChange={(open) => {
                    if (!open) {
                        setPreviewNode(null)
                    }
                }}
            />
        </Card>
    )
}
