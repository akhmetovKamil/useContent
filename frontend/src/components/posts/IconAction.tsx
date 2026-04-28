import type { ComponentType } from "react"

import { Button } from "@/components/ui/button"

export function IconAction({
    icon: Icon,
    label,
    onClick,
}: {
    icon: ComponentType<{ className?: string }>
    label: string
    onClick: () => void
}) {
    return (
        <Button
            className="rounded-full"
            onClick={onClick}
            size="sm"
            type="button"
            variant="outline"
        >
            <Icon className="size-4" />
            {label}
        </Button>
    )
}
