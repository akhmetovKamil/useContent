import { v4 as uuidv4 } from "uuid"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import type {
    AccessComposer,
    AccessPolicyBuilderState,
    AccessRuleForm,
} from "@/utils/access-policy"

interface AccessPolicyEditorProps {
    builder: AccessPolicyBuilderState
    disabled?: boolean
    onChange: (nextState: AccessPolicyBuilderState) => void
    subscriptionPlans?: Array<{ code: string; title: string }>
}

const ruleTypeOptions: Array<{ label: string; value: AccessRuleForm["type"] }> = [
    { label: "Public", value: "public" },
    { label: "Subscription", value: "subscription" },
    { label: "Token balance", value: "token_balance" },
    { label: "NFT ownership", value: "nft_ownership" },
]

const composerOptions: Array<{ label: string; value: AccessComposer }> = [
    { label: "Single", value: "single" },
    { label: "AND", value: "and" },
    { label: "OR", value: "or" },
]

export function AccessPolicyEditor({
    builder,
    disabled,
    onChange,
    subscriptionPlans = [],
}: AccessPolicyEditorProps) {
    return (
        <div className="grid gap-4 rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-5">
            <div className="grid gap-4 md:grid-cols-[220px_1fr]">
                <Label>
                    Composer
                    <Select
                        disabled={disabled}
                        onValueChange={(value) => {
                            const composer = value as AccessComposer
                            const nextRules =
                                composer === "single" ? builder.rules.slice(0, 1) : builder.rules

                            onChange({
                                composer,
                                rules: nextRules,
                            })
                        }}
                        value={builder.composer}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {composerOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </Label>

                <div className="rounded-2xl border border-[var(--line)] px-4 py-3 text-sm text-[var(--muted)]">
                    `Single` uses one rule. `AND` requires every rule to pass. `OR` allows access if
                    any rule passes.
                </div>
            </div>

            <div className="grid gap-4">
                {builder.rules.map((rule, index) => (
                    <RuleCard
                        builder={builder}
                        disabled={disabled}
                        index={index}
                        key={rule.id}
                        onChange={onChange}
                        rule={rule}
                        subscriptionPlans={subscriptionPlans}
                    />
                ))}
            </div>
        </div>
    )
}

interface RuleCardProps {
    builder: AccessPolicyBuilderState
    disabled?: boolean
    index: number
    onChange: (nextState: AccessPolicyBuilderState) => void
    rule: AccessRuleForm
    subscriptionPlans: Array<{ code: string; title: string }>
}

function RuleCard({ builder, disabled, index, onChange, rule, subscriptionPlans }: RuleCardProps) {
    const canRemove = builder.rules.length > 1
    const canAdd = builder.composer !== "single" && builder.rules.length < 4

    function updateRule(nextRule: AccessRuleForm) {
        onChange({
            ...builder,
            rules: builder.rules.map((currentRule) =>
                currentRule.id === nextRule.id ? nextRule : currentRule
            ),
        })
    }

    return (
        <div className="grid gap-4 rounded-[20px] border border-[var(--line)] bg-[var(--surface-strong)] p-4">
            <div className="flex flex-wrap items-center gap-3">
                <div className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">
                    Rule {index + 1}
                </div>
                <Select
                    disabled={disabled}
                    onValueChange={(value) =>
                        updateRule({
                            ...rule,
                            type: value as AccessRuleForm["type"],
                        })
                    }
                    value={rule.type}
                >
                    <SelectTrigger className="h-10 w-fit rounded-full px-3 py-2">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {ruleTypeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

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

                {canAdd && index === builder.rules.length - 1 ? (
                    <Button
                        className="rounded-full"
                        disabled={disabled}
                        onClick={() =>
                            onChange({
                                ...builder,
                                rules: [...builder.rules, createRuleFromTemplate(rule)],
                            })
                        }
                        size="sm"
                        type="button"
                    >
                        Add rule
                    </Button>
                ) : null}
            </div>

            {rule.type === "subscription" ? (
                <Label>
                    Subscription plan
                    {subscriptionPlans.length ? (
                        <Select
                            disabled={disabled}
                            onValueChange={(value) => updateRule({ ...rule, planCode: value })}
                            value={rule.planCode}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select plan" />
                            </SelectTrigger>
                            <SelectContent>
                                {subscriptionPlans.map((plan) => (
                                    <SelectItem key={plan.code} value={plan.code}>
                                        {plan.title} ({plan.code})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ) : (
                        <Input
                            disabled={disabled}
                            onChange={(event) =>
                                updateRule({ ...rule, planCode: event.target.value })
                            }
                            placeholder="main"
                            value={rule.planCode}
                        />
                    )}
                </Label>
            ) : null}

            {rule.type === "token_balance" ? (
                <div className="grid gap-4 md:grid-cols-2">
                    <LabeledInput
                        disabled={disabled}
                        label="Chain ID"
                        onChange={(value) => updateRule({ ...rule, chainId: value })}
                        value={rule.chainId}
                    />
                    <LabeledInput
                        disabled={disabled}
                        label="Contract address"
                        onChange={(value) => updateRule({ ...rule, contractAddress: value })}
                        value={rule.contractAddress}
                    />
                    <LabeledInput
                        disabled={disabled}
                        label="Min amount"
                        onChange={(value) => updateRule({ ...rule, minAmount: value })}
                        value={rule.minAmount}
                    />
                    <LabeledInput
                        disabled={disabled}
                        label="Decimals"
                        onChange={(value) => updateRule({ ...rule, decimals: value })}
                        value={rule.decimals}
                    />
                </div>
            ) : null}

            {rule.type === "nft_ownership" ? (
                <div className="grid gap-4 md:grid-cols-2">
                    <LabeledInput
                        disabled={disabled}
                        label="Chain ID"
                        onChange={(value) => updateRule({ ...rule, chainId: value })}
                        value={rule.chainId}
                    />
                    <LabeledInput
                        disabled={disabled}
                        label="Contract address"
                        onChange={(value) => updateRule({ ...rule, contractAddress: value })}
                        value={rule.contractAddress}
                    />
                    <Label>
                        Standard
                        <Select
                            disabled={disabled}
                            onValueChange={(value) =>
                                updateRule({
                                    ...rule,
                                    standard: value as AccessRuleForm["standard"],
                                })
                            }
                            value={rule.standard}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="erc721">erc721</SelectItem>
                                <SelectItem value="erc1155">erc1155</SelectItem>
                            </SelectContent>
                        </Select>
                    </Label>
                    <LabeledInput
                        disabled={disabled}
                        label="Token ID"
                        onChange={(value) => updateRule({ ...rule, tokenId: value })}
                        value={rule.tokenId}
                    />
                    <LabeledInput
                        disabled={disabled}
                        label="Min balance"
                        onChange={(value) => updateRule({ ...rule, minBalance: value })}
                        value={rule.minBalance}
                    />
                </div>
            ) : null}

            {rule.type === "public" ? (
                <div className="rounded-2xl border border-[var(--line)] px-4 py-3 text-sm text-[var(--muted)]">
                    This rule gives open access without any blockchain checks.
                </div>
            ) : null}
        </div>
    )
}

interface LabeledInputProps {
    disabled?: boolean
    label: string
    onChange: (value: string) => void
    value: string
}

function LabeledInput({ disabled, label, onChange, value }: LabeledInputProps) {
    return (
        <Label>
            {label}
            <Input
                disabled={disabled}
                onChange={(event) => onChange(event.target.value)}
                value={value}
            />
        </Label>
    )
}

function createRuleFromTemplate(rule: AccessRuleForm): AccessRuleForm {
    return {
        ...rule,
        id: uuidv4(),
    }
}
