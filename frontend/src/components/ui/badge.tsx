import { cva, type VariantProps } from "class-variance-authority"
import type * as React from "react"

import { cn } from "@/utils/cn"

const badgeVariants = cva(
    "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium uppercase tracking-[0.16em]",
    {
        variants: {
            variant: {
                default: "bg-[var(--surface-strong)] text-[var(--muted)]",
                success: "bg-emerald-100 text-emerald-800",
                warning: "bg-amber-100 text-amber-800",
                destructive: "bg-rose-100 text-rose-700",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

function Badge({
    className,
    variant,
    ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
    return <span className={cn(badgeVariants({ variant, className }))} {...props} />
}

export { Badge, badgeVariants }
