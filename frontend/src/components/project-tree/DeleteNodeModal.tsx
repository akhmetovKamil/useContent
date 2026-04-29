import type { ProjectNodeDto } from "@shared/types/projects"

import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"

interface DeleteNodeModalProps {
    isPending: boolean
    node: ProjectNodeDto | null
    onDelete: () => void
    onOpenChange: (open: boolean) => void
}

export function DeleteNodeModal({
    isPending,
    node,
    onDelete,
    onOpenChange,
}: DeleteNodeModalProps) {
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
