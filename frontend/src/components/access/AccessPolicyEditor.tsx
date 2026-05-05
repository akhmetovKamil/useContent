import { Info, Plus } from "lucide-react"
import { useState } from "react"

import { RuleCard } from "@/components/access/RuleCard"
import { composerOptions } from "@/components/access/options"
import { createRuleFromTemplate } from "@/components/access/helpers"
import type { AccessPolicyEditorProps } from "@/components/access/types"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Web3HelpModal } from "@/components/web3/pickers/Web3HelpModal"
import type { AccessComposer } from "@/utils/access-policy"
import { createDefaultRule } from "@/utils/access-policy"

export function AccessPolicyEditor({
    builder,
    disabled,
    onChange,
    onCreatePlan,
    subscriptionPlans = [],
}: AccessPolicyEditorProps) {
    const [helpOpen, setHelpOpen] = useState(false)
    const canAddRule = builder.composer !== "single" && builder.rules.length < 4

    return (
        <div className="grid min-w-0 gap-4 rounded-[32px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]">
            <div className="grid gap-4 md:grid-cols-[220px_1fr]">
                <Label>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className="inline-flex w-fit items-center gap-1 text-left">
                                    Conditions
                                    <Info className="size-4 text-[var(--muted)]" />
                                </span>
                            </TooltipTrigger>
                            <TooltipContent
                                className="max-w-xs leading-5"
                                side="top"
                                sideOffset={8}
                            >
                                Single uses one condition. AND requires every condition to pass. OR
                                allows access if any condition passes. Public content is selected on
                                posts and projects.
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <Select
                        disabled={disabled}
                        onValueChange={(value) => {
                            const composer = value as AccessComposer
                            const rules = builder.rules.length
                                ? builder.rules
                                : [createDefaultRule()]
                            const nextRules =
                                composer === "single"
                                    ? rules.slice(0, 1)
                                    : rules.length > 1
                                      ? rules
                                      : [...rules, createRuleFromTemplate(rules[0])]

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

                <div className="flex flex-wrap items-end justify-start gap-2 md:justify-end">
                    <Button
                        className="rounded-full"
                        onClick={() => setHelpOpen(true)}
                        size="sm"
                        type="button"
                        variant="outline"
                    >
                        <Info className="size-4" />
                        Web3 checks
                    </Button>
                    {canAddRule ? (
                        <Button
                            className="rounded-full"
                            disabled={disabled}
                            onClick={() =>
                                onChange({
                                    ...builder,
                                    rules: [
                                        ...builder.rules,
                                        createRuleFromTemplate(
                                            builder.rules[builder.rules.length - 1] ??
                                                createDefaultRule()
                                        ),
                                    ],
                                })
                            }
                            size="sm"
                            type="button"
                        >
                            <Plus className="size-4" />
                            Add rule
                        </Button>
                    ) : null}
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
                        onCreatePlan={onCreatePlan}
                        rule={rule}
                        subscriptionPlans={subscriptionPlans}
                    />
                ))}
            </div>
            <Web3HelpModal
                description="Access policies can combine subscriptions, token balances, and NFT ownership."
                onOpenChange={setHelpOpen}
                open={helpOpen}
                title="How web3 access checks work"
            />
        </div>
    )
}
