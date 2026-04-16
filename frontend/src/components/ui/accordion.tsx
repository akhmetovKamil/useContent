import type * as React from "react"

import { cn } from "@/utils/cn"

function Accordion({ className, ...props }: React.ComponentProps<"div">) {
    return <div className={cn("grid gap-3", className)} {...props} />
}

function AccordionItem({
    className,
    children,
    ...props
}: React.ComponentProps<"details">) {
    return (
        <details
            className={cn(
                "group rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 transition-colors open:bg-[var(--surface-strong)]",
                className
            )}
            {...props}
        >
            {children}
        </details>
    )
}

function AccordionTrigger({ className, children, ...props }: React.ComponentProps<"summary">) {
    return (
        <summary
            className={cn(
                "flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-[var(--foreground)] marker:hidden [&::-webkit-details-marker]:hidden",
                className
            )}
            {...props}
        >
            <span>{children}</span>
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--accent-soft)] text-[var(--foreground)] transition-transform group-open:rotate-45">
                +
            </span>
        </summary>
    )
}

function AccordionContent({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div className="accordion-content">
            <div
                className={cn(
                    "accordion-content-inner text-sm leading-6 text-[var(--muted)]",
                    className
                )}
                {...props}
            />
        </div>
    )
}

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger }
