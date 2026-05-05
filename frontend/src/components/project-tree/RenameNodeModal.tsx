import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

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
        <Dialog onOpenChange={onOpenChange} open={open}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Rename item</DialogTitle>
                    <DialogDescription>Rename this project file or folder.</DialogDescription>
                </DialogHeader>
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
            </DialogContent>
        </Dialog>
    )
}
