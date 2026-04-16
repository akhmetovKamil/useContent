import type * as React from "react"

import { cn } from "@/utils/cn"

function Label({ className, ...props }: React.ComponentProps<"label">) {
    return (
        <label
            className={cn("grid gap-2 text-sm font-medium text-[var(--foreground)]", className)}
            {...props}
        />
    )
}

export { Label }
