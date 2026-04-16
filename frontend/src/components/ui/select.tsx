import type * as React from "react"

import { cn } from "@/utils/cn"

function Select({ className, ...props }: React.ComponentProps<"select">) {
    return (
        <select
            className={cn(
                "flex h-11 w-full rounded-md border border-[var(--line)] bg-transparent px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60",
                className
            )}
            {...props}
        />
    )
}

export { Select }
