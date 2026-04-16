import type * as React from "react"

import { cn } from "@/utils/cn"

function PageSection({ className, ...props }: React.ComponentProps<"section">) {
    return (
        <section
            className={cn(
                "rounded-lg border border-[var(--line)] bg-[var(--surface-strong)] p-6 md:p-8",
                className
            )}
            {...props}
        />
    )
}

function Eyebrow({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            className={cn(
                "font-mono text-xs uppercase tracking-[0.35em] text-[var(--muted)]",
                className
            )}
            {...props}
        />
    )
}

function PageTitle({ className, ...props }: React.ComponentProps<"h1">) {
    return (
        <h1
            className={cn(
                "mt-3 font-[var(--serif)] text-3xl leading-tight text-[var(--foreground)] md:text-5xl",
                className
            )}
            {...props}
        />
    )
}

export { Eyebrow, PageSection, PageTitle }
