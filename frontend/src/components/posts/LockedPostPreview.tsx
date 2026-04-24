import { LockKeyhole } from "lucide-react"

import type { FeedPost } from "@/components/posts/types"

export function LockedPostPreview({ post }: { post: FeedPost }) {
    const accessLabel = "accessLabel" in post ? post.accessLabel : null

    return (
        <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-[var(--line)] bg-[var(--surface-strong)] p-4 text-sm text-[var(--muted)] sm:flex-row sm:items-center">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[var(--surface)] text-[var(--foreground)]">
                <LockKeyhole className="size-4" />
            </span>
            <span>
                This post belongs to{" "}
                <span className="font-medium text-[var(--foreground)]">
                    {accessLabel ?? "a locked tier"}
                </span>
                . Subscribe or satisfy the access conditions to read it.
            </span>
        </div>
    )
}
