import { ACCESS_POLICY_NODE_TYPE } from "@shared/consts"

import { getRuleTypeLabel } from "@/components/access/helpers"
import { NftOwnershipRuleForm } from "@/components/access/NftOwnershipRuleForm"
import { ruleTypeOptions } from "@/components/access/options"
import { SubscriptionRuleForm } from "@/components/access/SubscriptionRuleForm"
import { TokenBalanceRuleForm } from "@/components/access/TokenBalanceRuleForm"
import type { SubscriptionPlanOption } from "@/components/access/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { AccessPolicyBuilderState, AccessRuleForm } from "@/utils/access-policy"
import { cn } from "@/utils/cn"

export function RuleCard({
    builder,
    disabled,
    index,
    onChange,
    onCreatePlan,
    rule,
    subscriptionPlans,
}: {
    builder: AccessPolicyBuilderState
    disabled?: boolean
    index: number
    onChange: (nextState: AccessPolicyBuilderState) => void
    onCreatePlan?: () => void
    rule: AccessRuleForm
    subscriptionPlans: SubscriptionPlanOption[]
}) {
    const canRemove = builder.rules.length > 1

    function updateRule(nextRule: AccessRuleForm) {
        onChange({
            ...builder,
            rules: builder.rules.map((currentRule) =>
                currentRule.id === nextRule.id ? nextRule : currentRule
            ),
        })
    }

    return (
        <div className="grid gap-5 rounded-[28px] border border-[var(--line)] bg-[var(--surface-strong)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <div className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">
                        Rule {index + 1}
                    </div>
                    <div className="mt-1 font-[var(--serif)] text-2xl text-[var(--foreground)]">
                        {getRuleTypeLabel(rule.type)}
                    </div>
                </div>

                {canRemove ? (
                    <Button
                        className="rounded-full"
                        disabled={disabled}
                        onClick={() =>
                            onChange({
                                ...builder,
                                rules: builder.rules.filter(
                                    (currentRule) => currentRule.id !== rule.id
                                ),
                            })
                        }
                        size="sm"
                        type="button"
                        variant="outline"
                    >
                        Remove
                    </Button>
                ) : null}
            </div>

            <div className="grid gap-3 lg:grid-cols-3">
                {ruleTypeOptions.map((option) => {
                    const Icon = option.icon
                    const selected = rule.type === option.value

                    return (
                        <button
                            className={cn(
                                "rounded-[24px] border p-4 text-left transition hover:-translate-y-0.5",
                                selected
                                    ? "border-[var(--accent)] bg-[var(--accent-soft)] shadow-[var(--shadow)]"
                                    : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--accent)]"
                            )}
                            disabled={disabled}
                            key={option.value}
                            onClick={() =>
                                updateRule({
                                    ...rule,
                                    type: option.value,
                                })
                            }
                            type="button"
                        >
                            <div className="flex items-center gap-3">
                                <span className="grid size-10 place-items-center rounded-full bg-[var(--foreground)] text-[var(--surface)]">
                                    <Icon className="size-4" />
                                </span>
                                <div>
                                    <div className="font-medium text-[var(--foreground)]">
                                        {option.label}
                                    </div>
                                    {selected ? <Badge className="mt-1">selected</Badge> : null}
                                </div>
                            </div>
                            <p className="mt-3 text-xs leading-5 text-[var(--muted)]">
                                {option.description}
                            </p>
                        </button>
                    )
                })}
            </div>

            {rule.type === ACCESS_POLICY_NODE_TYPE.SUBSCRIPTION ? (
                <SubscriptionRuleForm
                    disabled={disabled}
                    onCreatePlan={onCreatePlan}
                    onChange={updateRule}
                    rule={rule}
                    subscriptionPlans={subscriptionPlans}
                />
            ) : null}

            {rule.type === ACCESS_POLICY_NODE_TYPE.TOKEN_BALANCE ? (
                <TokenBalanceRuleForm disabled={disabled} onChange={updateRule} rule={rule} />
            ) : null}

            {rule.type === ACCESS_POLICY_NODE_TYPE.NFT_OWNERSHIP ? (
                <NftOwnershipRuleForm disabled={disabled} onChange={updateRule} rule={rule} />
            ) : null}
        </div>
    )
}
