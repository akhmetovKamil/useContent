import type { VariantProps } from "class-variance-authority"

import { Badge, badgeVariants } from "@/components/ui/badge"

export function StatusPill({
    className,
    label,
    variant,
}: {
    className?: string
    label: string
    variant?: VariantProps<typeof badgeVariants>["variant"]
}) {
    return (
        <Badge className={className ?? "rounded-full"} variant={variant}>
            {label}
        </Badge>
    )
}
