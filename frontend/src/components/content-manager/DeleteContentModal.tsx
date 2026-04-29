import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
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
        <Modal
            description={
                deleteTarget ? `This will permanently delete "${deleteTarget.title}".` : undefined
            }
            onOpenChange={(open) => {
                if (!open) {
                    onTargetChange(null)
                }
            }}
            open={Boolean(deleteTarget)}
            title={`Delete ${kind}?`}
        >
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
        </Modal>
    )
}
