import type { ReactNode } from "react"

import { cn } from "@/utils/cn"

export function InfoMetric({
    children,
    className,
    label,
    value,
}: {
    children?: ReactNode
    className?: string
    label: ReactNode
    value: ReactNode
}) {
    return (
        <div className={cn("rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-4", className)}>
            <div className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">{label}</div>
            <div className="mt-1 text-2xl font-medium text-[var(--foreground)]">{value}</div>
            {children}
        </div>
    )
}
