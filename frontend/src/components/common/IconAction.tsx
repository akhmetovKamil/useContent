import type { ComponentType } from "react"

import { Button } from "@/components/ui/button"

export function IconAction({
    className,
    icon: Icon,
    iconOnly = false,
    label,
    onClick,
    variant = "outline",
}: {
    className?: string
    icon: ComponentType<{ className?: string }>
    iconOnly?: boolean
    label: string
    onClick: () => void
    variant?: "default" | "destructive" | "ghost" | "outline" | "secondary"
}) {
    return (
        <Button
            aria-label={iconOnly ? label : undefined}
            className={className ?? "rounded-full"}
            onClick={onClick}
            size={iconOnly ? "icon" : "sm"}
            type="button"
            title={iconOnly ? label : undefined}
            variant={variant}
        >
            <Icon className="size-4" />
            {iconOnly ? null : label}
        </Button>
    )
}
