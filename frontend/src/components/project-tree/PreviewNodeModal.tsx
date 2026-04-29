import type { ProjectNodeDto } from "@shared/types/projects"

import { ProjectFilePreview } from "@/components/project-tree/ProjectFilePreview"
import { Modal } from "@/components/ui/modal"

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
