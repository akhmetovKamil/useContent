import type * as React from "react"

import { cn } from "@/utils/cn"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
    return (
        <textarea
            className={cn(
                "flex min-h-28 w-full rounded-md border border-[var(--line)] bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-[var(--muted)] focus:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60",
                className
            )}
            {...props}
        />
    )
}

export { Textarea }
