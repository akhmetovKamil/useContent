import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import type { ContentManagerKind, ManagedContentItem } from "@/types/content-manager"

interface DeleteContentModalProps {
    deleteTarget: ManagedContentItem | null
    kind: ContentManagerKind
    onDelete: (itemId: string) => Promise<unknown>
    onTargetChange: (item: ManagedContentItem | null) => void
}

export function DeleteContentModal({
    deleteTarget,
    kind,
    onDelete,
    onTargetChange,
}: DeleteContentModalProps) {
    return (
        <Dialog
            onOpenChange={(open) => {
                if (!open) {
                    onTargetChange(null)
                }
            }}
            open={Boolean(deleteTarget)}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{`Delete ${kind}?`}</DialogTitle>
                    {deleteTarget ? (
                        <DialogDescription>
                            This will permanently delete "{deleteTarget.title}".
                        </DialogDescription>
                    ) : null}
                </DialogHeader>
            <div className="flex justify-end gap-2">
                <Button onClick={() => onTargetChange(null)} type="button" variant="outline">
                    Cancel
                </Button>
                <Button
                    onClick={() => {
                        if (!deleteTarget) {
                            return
                        }
                        void onDelete(deleteTarget.id).then(() => onTargetChange(null))
                    }}
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
