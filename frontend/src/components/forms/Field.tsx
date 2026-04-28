import type { ReactNode } from "react"

import { Label } from "@/components/ui/label"
import { cn } from "@/utils/cn"

export function Field({
    children,
    className,
    description,
    label,
}: {
    children: ReactNode
    className?: string
    description?: ReactNode
    label: ReactNode
}) {
    return (
        <Label className={cn("gap-1.5", className)}>
            {label}
            {children}
            {description ? (
                <span className="text-xs leading-4 text-[var(--muted)]">{description}</span>
            ) : null}
        </Label>
    )
}

export function FieldGrid({ children, className }: { children: ReactNode; className?: string }) {
    return <div className={cn("grid gap-4 md:grid-cols-2", className)}>{children}</div>
}
