import { ChevronDown } from "lucide-react"
import { useState } from "react"

import { PlanChoiceCard } from "@/components/access/PlanChoiceCard"
import type { SubscriptionPlanOption } from "@/components/access/types"
import { Button } from "@/components/ui/button"
import type { AccessRuleForm } from "@/utils/access-policy"

export function SubscriptionRuleForm({
    disabled,
    onCreatePlan,
    onChange,
    rule,
    subscriptionPlans,
}: {
    disabled?: boolean
    onCreatePlan?: () => void
    onChange: (nextRule: AccessRuleForm) => void
    rule: AccessRuleForm
    subscriptionPlans: SubscriptionPlanOption[]
}) {
    const [expanded, setExpanded] = useState(true)
    const selectedPlan = subscriptionPlans.find((plan) => plan.code === rule.planCode)

    return (
        <div className="grid gap-3 rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <div className="text-sm font-medium text-[var(--foreground)]">
                        Subscription condition
                    </div>
                    <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                        Select the paid plan that unlocks this policy.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {onCreatePlan ? (
                        <Button
                            className="rounded-full"
                            onClick={onCreatePlan}
                            size="sm"
                            type="button"
                            variant="outline"
                        >
                            Create plan
                        </Button>
                    ) : null}
                    <Button
                        className="rounded-full"
                        onClick={() => setExpanded((value) => !value)}
                        size="sm"
                        type="button"
                        variant="ghost"
                    >
                        <ChevronDown
                            className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`}
                        />
                        {expanded ? "Hide plans" : "Change plan"}
                    </Button>
                </div>
            </div>

            {selectedPlan ? <PlanChoiceCard plan={selectedPlan} selected /> : null}

            <div
                className={`grid overflow-hidden transition-all duration-300 ${
                    expanded ? "max-h-[560px] opacity-100" : "max-h-0 opacity-0"
                }`}
            >
                {subscriptionPlans.length ? (
                    <div className="grid gap-3 pt-1 md:grid-cols-2">
                        {subscriptionPlans.map((plan) => (
                            <button
                                disabled={disabled}
                                key={plan.code}
                                onClick={() => {
                                    onChange({ ...rule, planCode: plan.code })
                                    setExpanded(false)
                                }}
                                type="button"
                            >
                                <PlanChoiceCard
                                    plan={plan}
                                    selected={rule.planCode === plan.code}
                                />
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-2xl border border-dashed border-[var(--line)] p-4 text-sm text-[var(--muted)]">
                        Create a subscription plan first, then select it here.
                    </div>
                )}
            </div>
        </div>
    )
}
