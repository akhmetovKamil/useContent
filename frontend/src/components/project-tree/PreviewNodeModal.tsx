import type { ProjectNodeDto } from "@shared/types/projects"

import { ProjectFilePreview } from "@/components/project-tree/ProjectFilePreview"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface PreviewNodeModalProps {
    downloadUrl: string
    node: ProjectNodeDto | null
    onDownload: () => void
    onOpenChange: (open: boolean) => void
}

export function PreviewNodeModal({
    downloadUrl,
    node,
    onDownload,
    onOpenChange,
}: PreviewNodeModalProps) {
    return (
        <Dialog onOpenChange={onOpenChange} open={Boolean(node)}>
            <DialogContent className="max-w-5xl">
                <DialogHeader>
                    <DialogTitle>File preview</DialogTitle>
                </DialogHeader>
                {node ? (
                    <ProjectFilePreview
                        downloadUrl={downloadUrl}
                        node={node}
                        onDownload={onDownload}
                    />
                ) : null}
            </DialogContent>
        </Dialog>
    )
}
