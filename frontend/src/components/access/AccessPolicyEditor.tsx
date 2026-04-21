import { Coins, Info, KeyRound, Plus, Sparkles } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
    AddressInput,
    ChainPicker,
    NftPreviewCard,
    Web3HelpModal,
} from "@/components/web3/Web3Pickers"
import type {
    AccessComposer,
    AccessPolicyBuilderState,
    AccessRuleForm,
} from "@/utils/access-policy"
import { createDefaultRule } from "@/utils/access-policy"
import { cn } from "@/utils/cn"
import { getChainDisplayConfig } from "@/utils/config/chains"

interface AccessPolicyEditorProps {
    builder: AccessPolicyBuilderState
    disabled?: boolean
    onChange: (nextState: AccessPolicyBuilderState) => void
    subscriptionPlans?: Array<{ code: string; title: string }>
}

const ruleTypeOptions: Array<{
    description: string
    icon: typeof KeyRound
    label: string
    value: AccessRuleForm["type"]
}> = [
    {
        description: "Active paid tier from your subscription plans.",
        icon: KeyRound,
        label: "Subscription",
        value: "subscription",
    },
    {
        description: "ERC-20 balance check through backend RPC.",
        icon: Coins,
        label: "Token balance",
        value: "token_balance",
    },
    {
        description: "ERC-721 or ERC-1155 ownership gate.",
        icon: Sparkles,
        label: "NFT ownership",
        value: "nft_ownership",
    },
]

const composerOptions: Array<{ label: string; value: AccessComposer }> = [
    { label: "Public", value: "public" },
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
    const [helpOpen, setHelpOpen] = useState(false)
    const canAddRule =
        builder.composer !== "public" && builder.composer !== "single" && builder.rules.length < 4

    return (
        <div className="grid gap-4 rounded-[32px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]">
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
                                Public opens content to everyone. Single uses one rule. AND requires
                                every rule to pass. OR allows access if any rule passes.
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
                                composer === "single" || composer === "public"
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

            {builder.composer === "public" ? (
                <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--muted)]">
                    Public access does not require a wallet subscription, token balance, or NFT.
                </div>
            ) : (
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
            )}
            <Web3HelpModal
                description="Access policies can combine subscriptions, token balances, and NFT ownership."
                onOpenChange={setHelpOpen}
                open={helpOpen}
                title="How web3 access checks work"
            />
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

            {rule.type === "subscription" ? (
                <SubscriptionRuleForm
                    disabled={disabled}
                    onChange={updateRule}
                    rule={rule}
                    subscriptionPlans={subscriptionPlans}
                />
            ) : null}

            {rule.type === "token_balance" ? (
                <TokenBalanceRuleForm disabled={disabled} onChange={updateRule} rule={rule} />
            ) : null}

            {rule.type === "nft_ownership" ? (
                <NftOwnershipRuleForm disabled={disabled} onChange={updateRule} rule={rule} />
            ) : null}
        </div>
    )
}

function SubscriptionRuleForm({
    disabled,
    onChange,
    rule,
    subscriptionPlans,
}: {
    disabled?: boolean
    onChange: (nextRule: AccessRuleForm) => void
    rule: AccessRuleForm
    subscriptionPlans: Array<{ code: string; title: string }>
}) {
    return (
        <div className="rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-4">
            <Label>
                Subscription plan
                {subscriptionPlans.length ? (
                    <Select
                        disabled={disabled}
                        onValueChange={(value) => onChange({ ...rule, planCode: value })}
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
                        onChange={(event) => onChange({ ...rule, planCode: event.target.value })}
                        placeholder="main"
                        value={rule.planCode}
                    />
                )}
            </Label>
        </div>
    )
}

function TokenBalanceRuleForm({
    disabled,
    onChange,
    rule,
}: {
    disabled?: boolean
    onChange: (nextRule: AccessRuleForm) => void
    rule: AccessRuleForm
}) {
    const chainId = Number(rule.chainId)
    const chainConfig = Number.isFinite(chainId) ? getChainDisplayConfig(chainId) : null

    return (
        <div className="grid gap-4">
            <ChainPicker
                onChange={(nextChainId) => onChange({ ...rule, chainId: String(nextChainId) })}
                value={Number.isFinite(chainId) ? chainId : 11155111}
            />
            <div className="grid gap-4 md:grid-cols-[1fr_220px]">
                <AddressInput
                    description="The backend reads ERC-20 balanceOf(viewerWallet) on this contract."
                    label="ERC-20 contract address"
                    onChange={(value) => onChange({ ...rule, contractAddress: value })}
                    value={rule.contractAddress}
                />
                <LabeledInput
                    disabled={disabled}
                    label="Decimals"
                    onChange={(value) => onChange({ ...rule, decimals: value })}
                    value={rule.decimals}
                />
            </div>
            <div
                className={cn(
                    "overflow-hidden rounded-[28px] border border-[var(--line)] bg-gradient-to-br p-4",
                    chainConfig?.accent ?? "from-slate-400 to-neutral-700"
                )}
            >
                <Label className="text-white">
                    Minimum token balance
                    <Input
                        className="mt-2 h-14 rounded-2xl border-white/30 bg-white/20 font-mono text-lg text-white placeholder:text-white/60"
                        disabled={disabled}
                        onChange={(event) => onChange({ ...rule, minAmount: event.target.value })}
                        placeholder="1000000"
                        value={rule.minAmount}
                    />
                    <span className="mt-2 block text-xs leading-5 text-white/80">
                        Raw token units. Example: 1000000 for 1 USDC with 6 decimals.
                    </span>
                </Label>
            </div>
        </div>
    )
}

function NftOwnershipRuleForm({
    disabled,
    onChange,
    rule,
}: {
    disabled?: boolean
    onChange: (nextRule: AccessRuleForm) => void
    rule: AccessRuleForm
}) {
    const chainId = Number(rule.chainId)

    return (
        <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
            <div className="grid gap-4">
                <ChainPicker
                    onChange={(nextChainId) => onChange({ ...rule, chainId: String(nextChainId) })}
                    value={Number.isFinite(chainId) ? chainId : 11155111}
                />
                <AddressInput
                    description="Collection contract checked through RPC before private content is returned."
                    label="NFT collection address"
                    onChange={(value) => onChange({ ...rule, contractAddress: value })}
                    value={rule.contractAddress}
                />
                <div className="grid gap-4 md:grid-cols-3">
                    <Label>
                        Standard
                        <Select
                            disabled={disabled}
                            onValueChange={(value) =>
                                onChange({
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
                                <SelectItem value="erc721">ERC-721</SelectItem>
                                <SelectItem value="erc1155">ERC-1155</SelectItem>
                            </SelectContent>
                        </Select>
                    </Label>
                    <LabeledInput
                        disabled={disabled}
                        description="Optional for ERC-721, required for ERC-1155."
                        label="Token ID"
                        onChange={(value) => onChange({ ...rule, tokenId: value })}
                        value={rule.tokenId}
                    />
                    <LabeledInput
                        disabled={disabled}
                        description="Use 1 for simple ownership."
                        label="Min balance"
                        onChange={(value) => onChange({ ...rule, minBalance: value })}
                        value={rule.minBalance}
                    />
                </div>
            </div>
            <NftPreviewCard
                chainId={rule.chainId}
                contractAddress={rule.contractAddress}
                standard={rule.standard}
                tokenId={rule.tokenId}
            />
        </div>
    )
}

interface LabeledInputProps {
    description?: string
    disabled?: boolean
    label: string
    onChange: (value: string) => void
    value: string
}

function LabeledInput({ description, disabled, label, onChange, value }: LabeledInputProps) {
    return (
        <Label className="gap-1.5">
            {label}
            <Input
                disabled={disabled}
                onChange={(event) => onChange(event.target.value)}
                value={value}
            />
            {description ? (
                <span className="text-xs leading-4 text-[var(--muted)]">{description}</span>
            ) : null}
        </Label>
    )
}

function createRuleFromTemplate(rule: AccessRuleForm): AccessRuleForm {
    return {
        ...rule,
        id: uuidv4(),
    }
}

function getRuleTypeLabel(type: AccessRuleForm["type"]) {
    return ruleTypeOptions.find((option) => option.value === type)?.label ?? "Access rule"
}
