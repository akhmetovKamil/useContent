import type * as React from "react"

import { cn } from "@/utils/cn"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
    return (
        <input
            className={cn(
                "flex h-11 w-full rounded-md border border-[var(--line)] bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-[var(--muted)] focus:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60",
                className
            )}
            type={type}
            {...props}
        />
    )
}

export { Input }
