import type { ProjectNodeDto } from "@shared/types/projects"

import { ProjectFilePreview } from "@/components/project-tree/ProjectFilePreview"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Modal } from "@/components/ui/modal"

export function CreateFolderModal({
    folderName,
    isPending,
    onCreate,
    onFolderNameChange,
    onOpenChange,
    open,
}: {
    folderName: string
    isPending: boolean
    onCreate: () => void
    onFolderNameChange: (value: string) => void
    onOpenChange: (open: boolean) => void
    open: boolean
}) {
    return (
        <Modal
            description="Create a folder inside the current project location."
            onOpenChange={onOpenChange}
            open={open}
            title="New folder"
        >
            <form
                className="grid gap-4"
                onSubmit={(event) => {
                    event.preventDefault()
                    onCreate()
                }}
            >
                <Input
                    autoFocus
                    onChange={(event) => onFolderNameChange(event.target.value)}
                    placeholder="Folder name"
                    value={folderName}
                />
                <div className="flex justify-end gap-2">
                    <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
                        Cancel
                    </Button>
                    <Button disabled={isPending} type="submit">
                        Create folder
                    </Button>
                </div>
            </form>
        </Modal>
    )
}

export function RenameNodeModal({
    isPending,
    onOpenChange,
    onRename,
    onRenameNameChange,
    open,
    renameName,
}: {
    isPending: boolean
    onOpenChange: (open: boolean) => void
    onRename: () => void
    onRenameNameChange: (value: string) => void
    open: boolean
    renameName: string
}) {
    return (
        <Modal
            description="Rename this project file or folder."
            onOpenChange={onOpenChange}
            open={open}
            title="Rename item"
        >
            <form
                className="grid gap-4"
                onSubmit={(event) => {
                    event.preventDefault()
                    onRename()
                }}
            >
                <Input
                    autoFocus
                    onChange={(event) => onRenameNameChange(event.target.value)}
                    placeholder="New name"
                    value={renameName}
                />
                <div className="flex justify-end gap-2">
                    <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
                        Cancel
                    </Button>
                    <Button disabled={isPending} type="submit">
                        Save name
                    </Button>
                </div>
            </form>
        </Modal>
    )
}

export function DeleteNodeModal({
    isPending,
    node,
    onDelete,
    onOpenChange,
}: {
    isPending: boolean
    node: ProjectNodeDto | null
    onDelete: () => void
    onOpenChange: (open: boolean) => void
}) {
    return (
        <Modal
            description={node ? `This will delete "${node.name}" from the project.` : undefined}
            onOpenChange={onOpenChange}
            open={Boolean(node)}
            title="Delete item?"
        >
            <div className="flex justify-end gap-2">
                <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
                    Cancel
                </Button>
                <Button
                    disabled={isPending}
                    onClick={onDelete}
                    type="button"
                    variant="destructive"
                >
                    Delete
                </Button>
            </div>
        </Modal>
    )
}

export function PreviewNodeModal({
    downloadUrl,
    node,
    onDownload,
    onOpenChange,
}: {
    downloadUrl: string
    node: ProjectNodeDto | null
    onDownload: () => void
    onOpenChange: (open: boolean) => void
}) {
    return (
        <Modal
            className="max-w-5xl"
            onOpenChange={onOpenChange}
            open={Boolean(node)}
            title="File preview"
        >
            {node ? (
                <ProjectFilePreview downloadUrl={downloadUrl} node={node} onDownload={onDownload} />
            ) : null}
        </Modal>
    )
}
