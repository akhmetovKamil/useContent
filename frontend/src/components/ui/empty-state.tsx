import type { LucideIcon } from "lucide-react"
import { Layers3 } from "lucide-react"

import { Button } from "@/components/ui/button"

export function EmptyState({
    action,
    description,
    icon: Icon = Layers3,
    onAction,
    title,
}: {
    action?: string
    description: string
    icon?: LucideIcon
    onAction?: () => void
    title: string
}) {
    return (
        <div className="rounded-[28px] border border-dashed border-[var(--line)] bg-[var(--surface-strong)] p-8 text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                <Icon className="size-5" />
            </div>
            <h3 className="mt-4 font-medium text-[var(--foreground)]">{title}</h3>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--muted)]">
                {description}
            </p>
            {action && onAction ? (
                <Button className="mt-5 rounded-full" onClick={onAction} type="button">
                    {action}
                </Button>
            ) : null}
        </div>
    )
}
