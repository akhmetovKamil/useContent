import type { ReactNode } from "react"

import { cn } from "@/utils/cn"

export function ActionCard({
    children,
    className,
}: {
    children: ReactNode
    className?: string
}) {
    return (
        <div
            className={cn(
                "rounded-[24px] border border-[var(--line)] bg-[var(--surface-strong)] p-4",
                className
            )}
        >
            {children}
        </div>
    )
}
