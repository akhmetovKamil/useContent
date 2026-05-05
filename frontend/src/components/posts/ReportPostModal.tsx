import type { PostReportReason } from "@shared/types/posts"

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
import { validateForm } from "@/validation/form"
import { reportPostSchema } from "@/validation/schemas"
import { useState } from "react"

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
}) {
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

    function submit() {
        const result = validateForm(reportPostSchema, { comment, reason })
        setFieldErrors(result.fieldErrors)
        if (!result.success) {
            return
        }

        onSubmit()
    }

    return (
        <Modal
            description="Reports help keep promoted and public posts safe. The post will not be hidden automatically."
            onOpenChange={onOpenChange}
            open={open}
            title="Report post"
        >
            <form
                className="grid gap-4"
                onSubmit={(event) => {
                    event.preventDefault()
                    submit()
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
                    aria-invalid={Boolean(fieldErrors.comment)}
                    className="min-h-28"
                    maxLength={1000}
                    onChange={(event) => onCommentChange(event.target.value)}
                    placeholder="Optional context for moderation..."
                    value={comment}
                />
                {fieldErrors.reason ? (
                    <p className="text-sm text-rose-600">{fieldErrors.reason}</p>
                ) : null}
                {fieldErrors.comment ? (
                    <p className="text-sm text-rose-600">{fieldErrors.comment}</p>
                ) : null}
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
        </Modal>
    )
}
