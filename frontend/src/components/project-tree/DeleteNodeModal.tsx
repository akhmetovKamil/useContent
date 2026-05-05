import type { ProjectNodeDto } from "@shared/types/projects"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

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
        <Dialog onOpenChange={onOpenChange} open={Boolean(node)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete item?</DialogTitle>
                    {node ? (
                        <DialogDescription>
                            This will delete "{node.name}" from the project.
                        </DialogDescription>
                    ) : null}
                </DialogHeader>
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
            </DialogContent>
        </Dialog>
    )
}
