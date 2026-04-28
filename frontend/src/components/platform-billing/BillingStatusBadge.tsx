import { PLATFORM_BILLING_STATUS } from "@shared/consts"
import type { AuthorPlatformBillingDto } from "@shared/types/content"

import { StatusPill } from "@/components/ui/status-pill"

export function BillingStatusBadge({ billing }: { billing: AuthorPlatformBillingDto }) {
    const variant =
        billing.status === PLATFORM_BILLING_STATUS.ACTIVE
            ? "success"
            : billing.status === PLATFORM_BILLING_STATUS.GRACE
              ? "warning"
              : "default"

    return (
        <StatusPill
            className="w-fit rounded-full px-4 py-2"
            label={`${billing.plan.title} · ${billing.status}`}
            variant={variant}
        />
    )
}
