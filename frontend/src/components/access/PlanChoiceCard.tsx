import { Badge } from "@/components/ui/badge"
import { cn } from "@/utils/cn"
import type { SubscriptionPlanOption } from "@/components/access/types"

export function PlanChoiceCard({ plan, selected }: { plan: SubscriptionPlanOption; selected?: boolean }) {
    return (
        <div
            className={cn(
                "h-full rounded-[22px] border p-4 text-left transition",
                selected
                    ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                    : "border-[var(--line)] bg-[var(--surface-strong)] hover:border-[var(--accent)]"
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="font-medium text-[var(--foreground)]">{plan.title}</div>
                    <div className="mt-1 font-mono text-xs text-[var(--muted)]">{plan.code}</div>
                </div>
                {selected ? <Badge variant="success">selected</Badge> : null}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
                {plan.price ? <Badge>{plan.price}</Badge> : null}
                {plan.billingPeriodDays ? <Badge>{plan.billingPeriodDays} days</Badge> : null}
                {plan.chainId ? <Badge>chain {plan.chainId}</Badge> : null}
            </div>
        </div>
    )
}
