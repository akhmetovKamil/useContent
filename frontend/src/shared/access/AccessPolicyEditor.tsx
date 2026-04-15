import type { AccessComposer, AccessPolicyBuilderState, AccessRuleForm } from "./policy"

interface AccessPolicyEditorProps {
    builder: AccessPolicyBuilderState
    disabled?: boolean
    onChange: (nextState: AccessPolicyBuilderState) => void
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

export function AccessPolicyEditor({ builder, disabled, onChange }: AccessPolicyEditorProps) {
    return (
        <div className="grid gap-4 rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-5">
            <div className="grid gap-4 md:grid-cols-[220px_1fr]">
                <label className="grid gap-2 text-sm text-[var(--foreground)]">
                    Composer
                    <select
                        className="rounded-2xl border border-[var(--line)] bg-transparent px-4 py-3 outline-none"
                        disabled={disabled}
                        onChange={(event) => {
                            const composer = event.target.value as AccessComposer
                            const nextRules =
                                composer === "single" ? builder.rules.slice(0, 1) : builder.rules

                            onChange({
                                composer,
                                rules: nextRules,
                            })
                        }}
                        value={builder.composer}
                    >
                        {composerOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </label>

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
}

function RuleCard({ builder, disabled, index, onChange, rule }: RuleCardProps) {
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
                <select
                    className="rounded-full border border-[var(--line)] bg-transparent px-3 py-2 text-sm outline-none"
                    disabled={disabled}
                    onChange={(event) =>
                        updateRule({
                            ...rule,
                            type: event.target.value as AccessRuleForm["type"],
                        })
                    }
                    value={rule.type}
                >
                    {ruleTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>

                {canRemove ? (
                    <button
                        className="rounded-full border border-[var(--line)] px-3 py-2 text-sm text-[var(--foreground)]"
                        disabled={disabled}
                        onClick={() =>
                            onChange({
                                ...builder,
                                rules: builder.rules.filter(
                                    (currentRule) => currentRule.id !== rule.id
                                ),
                            })
                        }
                        type="button"
                    >
                        Remove
                    </button>
                ) : null}

                {canAdd && index === builder.rules.length - 1 ? (
                    <button
                        className="rounded-full bg-[var(--accent)] px-3 py-2 text-sm font-medium text-[var(--accent-foreground)]"
                        disabled={disabled}
                        onClick={() =>
                            onChange({
                                ...builder,
                                rules: [...builder.rules, createRuleFromTemplate(rule)],
                            })
                        }
                        type="button"
                    >
                        Add rule
                    </button>
                ) : null}
            </div>

            {rule.type === "subscription" ? (
                <label className="grid gap-2 text-sm text-[var(--foreground)]">
                    Plan code
                    <input
                        className="rounded-2xl border border-[var(--line)] bg-transparent px-4 py-3 outline-none"
                        disabled={disabled}
                        onChange={(event) => updateRule({ ...rule, planCode: event.target.value })}
                        placeholder="main"
                        value={rule.planCode}
                    />
                </label>
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
                    <label className="grid gap-2 text-sm text-[var(--foreground)]">
                        Standard
                        <select
                            className="rounded-2xl border border-[var(--line)] bg-transparent px-4 py-3 outline-none"
                            disabled={disabled}
                            onChange={(event) =>
                                updateRule({
                                    ...rule,
                                    standard: event.target.value as AccessRuleForm["standard"],
                                })
                            }
                            value={rule.standard}
                        >
                            <option value="erc721">erc721</option>
                            <option value="erc1155">erc1155</option>
                        </select>
                    </label>
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
        <label className="grid gap-2 text-sm text-[var(--foreground)]">
            {label}
            <input
                className="rounded-2xl border border-[var(--line)] bg-transparent px-4 py-3 outline-none"
                disabled={disabled}
                onChange={(event) => onChange(event.target.value)}
                value={value}
            />
        </label>
    )
}

function createRuleFromTemplate(rule: AccessRuleForm): AccessRuleForm {
    return {
        ...rule,
        id: crypto.randomUUID(),
    }
}
