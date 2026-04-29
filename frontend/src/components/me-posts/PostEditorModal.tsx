import type { PostDto } from "@shared/types/posts"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Modal } from "@/components/ui/modal"
import { Textarea } from "@/components/ui/textarea"

interface PostEditorModalProps {
    editContent: string
    editTitle: string
    editingPost: PostDto | null
    isPending: boolean
    onContentChange: (value: string) => void
    onOpenChange: (open: boolean) => void
    onSave: () => Promise<unknown>
    onTitleChange: (value: string) => void
}

export function PostEditorModal({
    editContent,
    editTitle,
    editingPost,
    isPending,
    onContentChange,
    onOpenChange,
    onSave,
    onTitleChange,
}: PostEditorModalProps) {
    return (
        <Modal
            description="Update the post copy without changing its access policy or attachments."
            onOpenChange={onOpenChange}
            open={Boolean(editingPost)}
            title="Edit post"
        >
            <form
                className="grid gap-4"
                onSubmit={(event) => {
                    event.preventDefault()
                    void onSave()
                }}
            >
                <Input
                    onChange={(event) => onTitleChange(event.target.value)}
                    placeholder="Post title"
                    value={editTitle}
                />
                <Textarea
                    className="min-h-40"
                    onChange={(event) => onContentChange(event.target.value)}
                    placeholder="Post content"
                    value={editContent}
                />
                <div className="flex justify-end gap-2">
                    <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
                        Cancel
                    </Button>
                    <Button disabled={isPending} type="submit">
                        Save changes
                    </Button>
                </div>
            </form>
        </Modal>
    )
}
