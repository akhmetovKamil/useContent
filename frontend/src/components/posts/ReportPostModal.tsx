import type { PostReportReason } from "@shared/types/content"

import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

export function ReportPostModal({
    comment,
    error,
    isPending,
    onCommentChange,
    onOpenChange,
    onReasonChange,
    onSubmit,
    open,
    reason,
    submitted,
}: {
    comment: string
    error: Error | null
    isPending: boolean
    onCommentChange: (value: string) => void
    onOpenChange: (open: boolean) => void
    onReasonChange: (value: PostReportReason) => void
    onSubmit: () => void
    open: boolean
    reason: PostReportReason
    submitted: boolean
}) {
    return (
        <Modal
            description="Reports help keep promoted and public posts safe. The post will not be hidden automatically."
            onOpenChange={onOpenChange}
            open={open}
            title="Report post"
        >
            {submitted ? (
                <div className="grid gap-4">
                    <p className="text-sm leading-6 text-[var(--muted)]">
                        Thanks. The report was saved for future moderation review.
                    </p>
                    <Button className="w-fit rounded-full" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </div>
            ) : (
                <form
                    className="grid gap-4"
                    onSubmit={(event) => {
                        event.preventDefault()
                        onSubmit()
                    }}
                >
                    <Select
                        onValueChange={(value) => onReasonChange(value as PostReportReason)}
                        value={reason}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="spam">Spam</SelectItem>
                            <SelectItem value="scam">Scam or fraud</SelectItem>
                            <SelectItem value="illegal_content">Illegal content</SelectItem>
                            <SelectItem value="abuse">Abuse or harassment</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                    <Textarea
                        className="min-h-28"
                        maxLength={1000}
                        onChange={(event) => onCommentChange(event.target.value)}
                        placeholder="Optional context for moderation..."
                        value={comment}
                    />
                    {error ? <p className="text-sm text-rose-600">{error.message}</p> : null}
                    <div className="flex justify-end gap-2">
                        <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
                            Cancel
                        </Button>
                        <Button disabled={isPending} type="submit">
                            {isPending ? "Saving..." : "Submit report"}
                        </Button>
                    </div>
                </form>
            )}
        </Modal>
    )
}
