import type * as React from "react"

import { cn } from "@/utils/cn"

function Dock({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            className={cn(
                "mx-auto flex w-fit max-w-full items-center gap-2 overflow-visible rounded-[28px] border border-[var(--line)] bg-[var(--surface)] px-3 py-3 shadow-[var(--shadow)] backdrop-blur-xl",
                className
            )}
            {...props}
        />
    )
}

function DockItem({
    active,
    className,
    icon,
    label,
    ...props
}: React.ComponentProps<"div"> & {
    active?: boolean
    icon: React.ReactNode
    label: string
}) {
    return (
        <div
            aria-label={label}
            className={cn(
                "group relative grid size-12 shrink-0 cursor-pointer place-items-center rounded-2xl text-[var(--foreground)] transition duration-200 hover:-translate-y-1 hover:scale-110",
                active
                    ? "bg-[var(--accent-soft)] text-[var(--foreground)]"
                    : "hover:bg-[var(--accent-soft)]",
                className
            )}
            {...props}
        >
            <span className="absolute -top-12 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-xl bg-[var(--foreground)] px-3 py-1.5 text-xs text-[var(--surface)] shadow-lg group-hover:block">
                {label}
                <span className="absolute left-1/2 top-full size-2 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-[var(--foreground)]" />
            </span>
            <span className="grid size-6 place-items-center transition group-hover:scale-105">
                {icon}
            </span>
        </div>
    )
}

function DockSeparator({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            className={cn("mx-1 h-10 w-px shrink-0 bg-[var(--line)]", className)}
            {...props}
        />
    )
}

export { Dock, DockItem, DockSeparator }
