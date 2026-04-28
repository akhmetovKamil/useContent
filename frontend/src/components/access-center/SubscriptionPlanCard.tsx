import type { SubscriptionPlanDto } from "@shared/types/content"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatPlanAmount } from "@/utils/subscription-plan"

export function SubscriptionPlanCard({
    onDelete,
    onEdit,
    plan,
}: {
    onDelete: () => void
    onEdit: () => void
    plan: SubscriptionPlanDto
}) {
    return (
        <div className="rounded-[30px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_16px_48px_rgba(15,23,42,0.05)]">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h3 className="font-[var(--serif)] text-2xl text-[var(--foreground)]">
                        {plan.title}
                    </h3>
                    <p className="mt-1 font-mono text-xs text-[var(--muted)]">{plan.code}</p>
                </div>
                <Badge>{plan.active ? "active" : "inactive"}</Badge>
            </div>
            <div className="mt-5 grid gap-3 text-sm text-[var(--muted)]">
                <div className="rounded-2xl bg-[var(--surface-strong)] p-3 text-[var(--foreground)]">
                    {formatPlanAmount(
                        plan.chainId,
                        plan.tokenAddress,
                        plan.price,
                        plan.paymentAsset
                    )}
                </div>
                <div className="flex flex-wrap gap-2">
                    <Badge>Every {plan.billingPeriodDays} days</Badge>
                    <Badge>Chain {plan.chainId}</Badge>
                    <Badge>{plan.activeSubscribersCount} active subscribers</Badge>
                </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
                <Button
                    className="rounded-full"
                    onClick={onEdit}
                    size="sm"
                    type="button"
                    variant="outline"
                >
                    Edit
                </Button>
                <Button
                    className="rounded-full"
                    onClick={onDelete}
                    size="sm"
                    type="button"
                    variant="destructive"
                >
                    Delete
                </Button>
            </div>
        </div>
    )
}
