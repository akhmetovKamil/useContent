import { PLATFORM_BILLING_STATUS } from "@shared/consts"
import type { AuthorPlatformBillingDto } from "@shared/types/content"
import { AlertTriangle, Clock } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { formatBillingDate } from "@/utils/platform-billing"

export function StateBanner({ billing }: { billing: AuthorPlatformBillingDto }) {
    if (billing.status === PLATFORM_BILLING_STATUS.ACTIVE) {
        return null
    }

    const isGrace = billing.status === PLATFORM_BILLING_STATUS.GRACE
    const Icon = isGrace ? Clock : AlertTriangle
    const title = isGrace ? "Grace period is active" : "Free limits are active"
    const description = isGrace
        ? `Uploads are paused until renewal. You can still download or delete content until ${formatBillingDate(
              billing.graceUntil
          )}.`
        : "If usage is above the Free quota, new uploads stay blocked until storage is reduced or the plan is renewed."

    return (
        <Card className="mt-6 rounded-[28px] border-amber-200 bg-amber-50/80 text-slate-950">
            <CardContent className="flex gap-3 p-5">
                <Icon className="mt-0.5 size-5 shrink-0 text-amber-700" />
                <div>
                    <div className="font-medium">{title}</div>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
                </div>
            </CardContent>
        </Card>
    )
}
