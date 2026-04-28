import { FolderPlus, Upload } from "lucide-react"
import type { RefObject } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function ProjectTreeToolbar({
    fileInputRef,
    folderInputRef,
    onCreateFolder,
    onUploadFiles,
    onUploadFolderFiles,
}: {
    fileInputRef: RefObject<HTMLInputElement | null>
    folderInputRef: RefObject<HTMLInputElement | null>
    onCreateFolder: () => void
    onUploadFiles: (files: File[]) => void
    onUploadFolderFiles: (files: File[]) => void
}) {
    return (
        <div className="flex flex-wrap gap-2">
            <Button
                className="rounded-full"
                onClick={onCreateFolder}
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
                        onUploadFiles(files)
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
                        onUploadFolderFiles(files)
                    }
                    event.currentTarget.value = ""
                }}
                multiple
                ref={folderInputRef}
                type="file"
                {...{ directory: "", webkitdirectory: "" }}
            />
        </div>
    )
}
