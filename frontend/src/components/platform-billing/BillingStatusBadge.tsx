import type { AuthorPlatformBillingDto } from "@shared/types/content"

import { Badge } from "@/components/ui/badge"

export function BillingStatusBadge({ billing }: { billing: AuthorPlatformBillingDto }) {
    const variant =
        billing.status === "active" ? "success" : billing.status === "grace" ? "warning" : "default"

    return (
        <Badge className="w-fit rounded-full px-4 py-2" variant={variant}>
            {billing.plan.title} · {billing.status}
        </Badge>
    )
}
