import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Modal } from "@/components/ui/modal"

interface RenameNodeModalProps {
    isPending: boolean
    onOpenChange: (open: boolean) => void
    onRename: () => void
    onRenameNameChange: (value: string) => void
    open: boolean
    renameName: string
}

export function RenameNodeModal({
    isPending,
    onOpenChange,
    onRename,
    onRenameNameChange,
    open,
    renameName,
}: RenameNodeModalProps) {
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
