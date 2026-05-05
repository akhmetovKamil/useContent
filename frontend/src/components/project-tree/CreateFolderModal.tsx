import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

interface CreateFolderModalProps {
    folderName: string
    isPending: boolean
    onCreate: () => void
    onFolderNameChange: (value: string) => void
    onOpenChange: (open: boolean) => void
    open: boolean
}

export function CreateFolderModal({
    folderName,
    isPending,
    onCreate,
    onFolderNameChange,
    onOpenChange,
    open,
}: CreateFolderModalProps) {
    return (
        <Dialog onOpenChange={onOpenChange} open={open}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>New folder</DialogTitle>
                    <DialogDescription>
                        Create a folder inside the current project location.
                    </DialogDescription>
                </DialogHeader>
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
            </DialogContent>
        </Dialog>
    )
}
