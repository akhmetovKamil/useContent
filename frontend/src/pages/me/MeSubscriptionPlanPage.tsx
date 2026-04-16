import { useEffect, useState } from "react"
import { usePublicClient } from "wagmi"
import { formatUnits, isAddress, parseUnits, type Address } from "viem"

import { AccessPolicyEditor } from "@/components/access/AccessPolicyEditor"
import { OnChainPlanPublisher } from "@/components/subscriptions/OnChainPlanPublisher"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eyebrow, PageSection } from "@/components/ui/page"
import { Textarea } from "@/components/ui/textarea"
import {
    useCreateMyAccessPolicyMutation,
    useDeleteMyAccessPolicyMutation,
    useMyAccessPoliciesQuery,
    useUpdateMyAccessPolicyMutation,
} from "@/queries/access-policies"
import {
    useDeleteMySubscriptionPlanMutation,
    useMySubscriptionPlansQuery,
    useSubscriptionManagerDeploymentQuery,
    useUpsertMySubscriptionPlanMutation,
} from "@/queries/subscription-plans"
import { useAuthStore } from "@/stores/auth-store"
import {
    buildPolicyInputFromBuilder,
    createDefaultPolicyBuilderState,
    summarizePolicyInput,
    type AccessPolicyBuilderState,
} from "@/utils/access-policy"
import { defaultSubscriptionChain, supportedChainOptions } from "@/utils/config/chains"
import { getTokenPresets, type TokenPreset } from "@/utils/config/tokens"
import { erc20Abi } from "@/utils/web3/erc20"

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

const defaultToken = getTokenPresets(defaultSubscriptionChain.id).find(
    (preset) => preset.kind === "erc20"
)

export function MeSubscriptionPlanPage() {
    const token = useAuthStore((state) => state.token)
    const plansQuery = useMySubscriptionPlansQuery(Boolean(token))
    const policiesQuery = useMyAccessPoliciesQuery(Boolean(token))
    const upsertPlanMutation = useUpsertMySubscriptionPlanMutation()
    const deletePlanMutation = useDeleteMySubscriptionPlanMutation()
    const createPolicyMutation = useCreateMyAccessPolicyMutation()
    const updatePolicyMutation = useUpdateMyAccessPolicyMutation()
    const deletePolicyMutation = useDeleteMyAccessPolicyMutation()

    const [code, setCode] = useState("main")
    const [title, setTitle] = useState("Main subscription")
    const [chainId, setChainId] = useState(String(defaultSubscriptionChain.id))
    const [tokenAddress, setTokenAddress] = useState(defaultToken?.address ?? "")
    const [selectedTokenId, setSelectedTokenId] = useState(
        defaultToken ? getTokenId(defaultToken) : "custom"
    )
    const [customTokenDecimals, setCustomTokenDecimals] = useState("18")
    const [customTokenName, setCustomTokenName] = useState("")
    const [customTokenSymbol, setCustomTokenSymbol] = useState("")
    const [customTokenLookupState, setCustomTokenLookupState] = useState<
        "idle" | "loading" | "success" | "error"
    >("idle")
    const [customTokenLookupError, setCustomTokenLookupError] = useState("")
    const [amount, setAmount] = useState("1")
    const [billingPeriodDays, setBillingPeriodDays] = useState("30")
    const [planKey, setPlanKey] = useState("")
    const [registrationTxHash, setRegistrationTxHash] = useState("")
    const [policyName, setPolicyName] = useState("Subscribers only")
    const [policyDescription, setPolicyDescription] = useState("")
    const [policyIsDefault, setPolicyIsDefault] = useState(false)
    const [policyBuilder, setPolicyBuilder] = useState<AccessPolicyBuilderState>(
        createDefaultPolicyBuilderState()
    )
    const [policyError, setPolicyError] = useState<string | null>(null)
    const selectedChainId = Number(chainId)
    const publicClient = usePublicClient({ chainId: selectedChainId })
    const managerDeploymentQuery = useSubscriptionManagerDeploymentQuery(selectedChainId)
    const tokenPresets = getTokenPresets(selectedChainId)
    const selectedToken = tokenPresets.find((preset) => getTokenId(preset) === selectedTokenId)
    const paymentAsset = selectedToken?.kind === "native" ? "native" : "erc20"
    const planTokenAddress = paymentAsset === "native" ? ZERO_ADDRESS : tokenAddress
    const tokenDecimals =
        selectedToken?.kind === "custom"
            ? Number(customTokenDecimals)
            : (selectedToken?.decimals ?? 18)
    const amountInBaseUnits = toBaseUnits(amount, tokenDecimals)

    useEffect(() => {
        if (selectedToken?.kind !== "custom") {
            setCustomTokenLookupState("idle")
            setCustomTokenLookupError("")
            return
        }
        if (!isAddress(tokenAddress) || !publicClient) {
            setCustomTokenLookupState("idle")
            setCustomTokenLookupError("")
            return
        }

        let cancelled = false
        setCustomTokenLookupState("loading")
        setCustomTokenLookupError("")

        Promise.all([
            publicClient.readContract({
                address: tokenAddress as Address,
                abi: erc20Abi,
                functionName: "decimals",
            }),
            publicClient.readContract({
                address: tokenAddress as Address,
                abi: erc20Abi,
                functionName: "symbol",
            }),
            publicClient.readContract({
                address: tokenAddress as Address,
                abi: erc20Abi,
                functionName: "name",
            }),
        ])
            .then(([decimals, symbol, name]) => {
                if (cancelled) {
                    return
                }
                setCustomTokenDecimals(String(decimals))
                setCustomTokenSymbol(symbol)
                setCustomTokenName(name)
                setCustomTokenLookupState("success")
            })
            .catch(() => {
                if (cancelled) {
                    return
                }
                setCustomTokenSymbol("")
                setCustomTokenName("")
                setCustomTokenLookupState("error")
                setCustomTokenLookupError(
                    "Could not read ERC-20 metadata. Check network/address or enter decimals manually."
                )
            })

        return () => {
            cancelled = true
        }
    }, [publicClient, selectedToken?.kind, tokenAddress])

    useEffect(() => {
        if (!plansQuery.data?.length) {
            return
        }

        const plan = plansQuery.data.find((item) => item.code === "main") ?? plansQuery.data[0]
        const tokenPreset = getTokenPresetByAddress(
            plan.chainId,
            plan.tokenAddress,
            plan.paymentAsset ?? "erc20"
        )
        const decimals = tokenPreset?.decimals ?? 18
        setCode(plan.code)
        setTitle(plan.title)
        setChainId(String(plan.chainId))
        setTokenAddress(plan.paymentAsset === "native" ? ZERO_ADDRESS : plan.tokenAddress)
        setSelectedTokenId(tokenPreset ? getTokenId(tokenPreset) : "custom")
        setCustomTokenDecimals(String(decimals))
        setAmount(formatUnits(BigInt(plan.price), decimals))
        setBillingPeriodDays(String(plan.billingPeriodDays))
        setPlanKey(plan.planKey)
        setRegistrationTxHash(plan.registrationTxHash ?? "")
    }, [plansQuery.data])

    const selectedPlan = plansQuery.data?.find((plan) => plan.code === code)
    const managerAddress =
        managerDeploymentQuery.data?.address ?? selectedPlan?.contractAddress ?? ""

    return (
        <PageSection>
            <Eyebrow>Access rules</Eyebrow>
            <h2 className="mt-3 font-[var(--serif)] text-3xl text-[var(--foreground)]">
                Subscription plans and reusable access policies
            </h2>
            {!token ? (
                <p className="mt-3 text-[var(--muted)]">
                    После авторизации здесь будут планы подписки и сохраненные условия доступа.
                </p>
            ) : (
                <div className="mt-6 grid gap-6 xl:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Subscription plans</CardTitle>
                            <CardDescription>
                                Можно создать несколько планов и потом выбирать их в policy builder.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <Label>
                                        Title
                                        <Input
                                            onChange={(event) => {
                                                const value = event.target.value
                                                setTitle(value)
                                                if (!selectedPlan) {
                                                    setCode(buildPlanCode(value))
                                                }
                                            }}
                                            value={title}
                                        />
                                    </Label>
                                    <Label>
                                        Billing days
                                        <Input
                                            onChange={(event) =>
                                                setBillingPeriodDays(event.target.value)
                                            }
                                            value={billingPeriodDays}
                                        />
                                    </Label>
                                </div>
                                <div className="grid gap-2">
                                    <div>
                                        <div className="text-sm font-medium text-[var(--foreground)]">
                                            Network
                                        </div>
                                        <p className="mt-1 text-xs text-[var(--muted)]">
                                            Select where this subscription plan will be registered.
                                        </p>
                                    </div>
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        {supportedChainOptions.map((chain) => (
                                            <button
                                                className={`rounded-2xl border p-4 text-left transition ${
                                                    chainId === String(chain.id)
                                                        ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                                                        : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--accent)]"
                                                }`}
                                                key={chain.id}
                                                onClick={() => {
                                                    setChainId(String(chain.id))
                                                    const nextToken = getTokenPresets(
                                                        chain.id
                                                    ).find((preset) => preset.kind === "erc20")
                                                    setSelectedTokenId(
                                                        nextToken ? getTokenId(nextToken) : "custom"
                                                    )
                                                    setTokenAddress(nextToken?.address ?? "")
                                                    setCustomTokenName("")
                                                    setCustomTokenSymbol("")
                                                    setCustomTokenLookupState("idle")
                                                    setCustomTokenLookupError("")
                                                }}
                                                type="button"
                                            >
                                                <span
                                                    className={`inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${chain.accent} text-xs font-semibold text-white`}
                                                >
                                                    {chain.icon}
                                                </span>
                                                <span className="ml-3 font-medium">
                                                    {chain.shortName}
                                                </span>
                                                <span className="ml-2 text-xs text-[var(--muted)]">
                                                    {chain.testnet ? "testnet" : "mainnet"}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <div>
                                        <div className="text-sm font-medium text-[var(--foreground)]">
                                            Token type
                                        </div>
                                        <p className="mt-1 text-xs text-[var(--muted)]">
                                            Use a native chain token or pick an ERC-20 token preset.
                                        </p>
                                    </div>
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        {tokenPresets.map((preset) => (
                                            <button
                                                className={`rounded-2xl border p-3 text-left transition ${
                                                    selectedTokenId === getTokenId(preset)
                                                        ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                                                        : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--accent)]"
                                                } ${preset.disabled ? "cursor-not-allowed opacity-55" : ""}`}
                                                disabled={preset.disabled}
                                                key={getTokenId(preset)}
                                                onClick={() => {
                                                    setSelectedTokenId(getTokenId(preset))
                                                    setTokenAddress(
                                                        preset.kind === "native"
                                                            ? ZERO_ADDRESS
                                                            : (preset.address ?? "")
                                                    )
                                                    setCustomTokenDecimals(String(preset.decimals))
                                                    setCustomTokenName("")
                                                    setCustomTokenSymbol("")
                                                    setCustomTokenLookupState("idle")
                                                    setCustomTokenLookupError("")
                                                }}
                                                type="button"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--foreground)] text-xs font-semibold text-[var(--surface)]">
                                                        {preset.symbol.slice(0, 4)}
                                                    </span>
                                                    <span className="font-medium">
                                                        {preset.symbol}
                                                    </span>
                                                    {preset.disabled ? <Badge>soon</Badge> : null}
                                                </div>
                                                <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
                                                    {preset.helper}
                                                </p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {selectedToken?.kind === "custom" ? (
                                    <div className="grid gap-4 md:grid-cols-[1fr_140px]">
                                        <Label>
                                            Custom token address
                                            <Input
                                                className="font-mono"
                                                onChange={(event) => {
                                                    setTokenAddress(event.target.value)
                                                    setCustomTokenName("")
                                                    setCustomTokenSymbol("")
                                                }}
                                                placeholder="0x..."
                                                value={tokenAddress}
                                            />
                                        </Label>
                                        <Label>
                                            Decimals
                                            <Input
                                                onChange={(event) =>
                                                    setCustomTokenDecimals(event.target.value)
                                                }
                                                value={customTokenDecimals}
                                            />
                                        </Label>
                                        <div className="md:col-span-2">
                                            {customTokenLookupState === "loading" ? (
                                                <p className="text-xs text-[var(--muted)]">
                                                    Reading ERC-20 metadata...
                                                </p>
                                            ) : null}
                                            {customTokenLookupState === "success" ? (
                                                <p className="text-xs text-emerald-700">
                                                    Detected {customTokenName || "token"}{" "}
                                                    {customTokenSymbol
                                                        ? `(${customTokenSymbol})`
                                                        : ""}{" "}
                                                    with {customTokenDecimals} decimals.
                                                </p>
                                            ) : null}
                                            {customTokenLookupState === "error" ? (
                                                <p className="text-xs text-amber-700">
                                                    {customTokenLookupError}
                                                </p>
                                            ) : null}
                                        </div>
                                    </div>
                                ) : null}
                                <Label>
                                    Amount
                                    <Input
                                        onChange={(event) => setAmount(event.target.value)}
                                        placeholder="10"
                                        value={amount}
                                    />
                                    <span className="mt-1 block text-xs text-[var(--muted)]">
                                        Saved on-chain amount:{" "}
                                        <span className="font-mono">{amountInBaseUnits}</span>
                                    </span>
                                </Label>
                                <div className="grid gap-1 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 text-xs text-[var(--muted)]">
                                    <div>
                                        Manager:{" "}
                                        <span className="break-all font-mono">
                                            {managerDeploymentQuery.isLoading
                                                ? "loading..."
                                                : managerAddress ||
                                                  "not configured for selected network"}
                                        </span>
                                    </div>
                                    <div>
                                        Internal code: <span className="font-mono">{code}</span>
                                    </div>
                                    {planKey ? (
                                        <div>
                                            Plan key:{" "}
                                            <span className="break-all font-mono">{planKey}</span>
                                        </div>
                                    ) : null}
                                    {registrationTxHash ? (
                                        <div>
                                            Registration tx:{" "}
                                            <span className="break-all font-mono">
                                                {registrationTxHash}
                                            </span>
                                        </div>
                                    ) : null}
                                </div>
                                {upsertPlanMutation.isError ? (
                                    <p className="text-sm text-rose-600">
                                        {upsertPlanMutation.error.message}
                                    </p>
                                ) : null}
                                {!managerAddress ? (
                                    <p className="text-sm text-amber-700">
                                        Deploy SubscriptionManager for this network first. The
                                        deployment address will be loaded from backend registry.
                                    </p>
                                ) : null}
                                <OnChainPlanPublisher
                                    active
                                    billingPeriodDays={Number(billingPeriodDays)}
                                    chainId={selectedChainId}
                                    code={code}
                                    contractAddress={managerAddress}
                                    disabled={
                                        upsertPlanMutation.isPending ||
                                        !managerAddress ||
                                        !planTokenAddress ||
                                        !amountInBaseUnits
                                    }
                                    existingPlanKey={selectedPlan?.planKey}
                                    onPublished={(published) => {
                                        setPlanKey(published.planKey ?? "")
                                        setRegistrationTxHash(published.registrationTxHash ?? "")
                                        void upsertPlanMutation.mutateAsync({
                                            code,
                                            title,
                                            paymentAsset,
                                            chainId: selectedChainId,
                                            tokenAddress: planTokenAddress,
                                            price: amountInBaseUnits,
                                            billingPeriodDays: Number(billingPeriodDays),
                                            contractAddress: managerAddress,
                                            planKey: published.planKey,
                                            registrationTxHash: published.registrationTxHash,
                                            active: true,
                                        })
                                    }}
                                    price={amountInBaseUnits}
                                    paymentAsset={paymentAsset}
                                    tokenAddress={planTokenAddress}
                                />
                            </div>

                            <div className="mt-6 grid gap-3">
                                {plansQuery.data?.map((plan) => (
                                    <div
                                        className="rounded-lg border border-[var(--line)] p-4"
                                        key={plan.id}
                                    >
                                        <button
                                            className="w-full text-left"
                                            onClick={() => {
                                                setCode(plan.code)
                                                setTitle(plan.title)
                                                setChainId(String(plan.chainId))
                                                setTokenAddress(
                                                    plan.paymentAsset === "native"
                                                        ? ZERO_ADDRESS
                                                        : plan.tokenAddress
                                                )
                                                const tokenPreset = getTokenPresetByAddress(
                                                    plan.chainId,
                                                    plan.tokenAddress,
                                                    plan.paymentAsset ?? "erc20"
                                                )
                                                const decimals = tokenPreset?.decimals ?? 18
                                                setSelectedTokenId(
                                                    tokenPreset ? getTokenId(tokenPreset) : "custom"
                                                )
                                                setCustomTokenDecimals(String(decimals))
                                                setAmount(formatUnits(BigInt(plan.price), decimals))
                                                setBillingPeriodDays(String(plan.billingPeriodDays))
                                                setPlanKey(plan.planKey)
                                                setRegistrationTxHash(plan.registrationTxHash ?? "")
                                            }}
                                            type="button"
                                        >
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-medium">{plan.title}</span>
                                                <Badge>{plan.chainId}</Badge>
                                            </div>
                                            <div className="mt-2 text-sm text-[var(--muted)]">
                                                {formatPlanAmount(
                                                    plan.chainId,
                                                    plan.tokenAddress,
                                                    plan.price,
                                                    plan.paymentAsset ?? "erc20"
                                                )}{" "}
                                                every {plan.billingPeriodDays} days
                                            </div>
                                            <div className="mt-2 break-all font-mono text-xs text-[var(--muted)]">
                                                {plan.planKey}
                                            </div>
                                        </button>
                                        <Button
                                            className="mt-3 rounded-full"
                                            disabled={deletePlanMutation.isPending}
                                            onClick={() =>
                                                void deletePlanMutation.mutateAsync(plan.id)
                                            }
                                            type="button"
                                            variant="outline"
                                        >
                                            Delete plan
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            {deletePlanMutation.isError ? (
                                <p className="mt-3 text-sm text-rose-600">
                                    {deletePlanMutation.error.message}
                                </p>
                            ) : null}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Access policies</CardTitle>
                            <CardDescription>
                                Эти условия потом выбираются у постов и проектов.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form
                                className="grid gap-4"
                                onSubmit={(event) => {
                                    event.preventDefault()
                                    setPolicyError(null)
                                    try {
                                        void createPolicyMutation.mutateAsync({
                                            name: policyName,
                                            description: policyDescription,
                                            isDefault: policyIsDefault,
                                            policyInput: buildPolicyInputFromBuilder(policyBuilder),
                                        })
                                    } catch (error) {
                                        setPolicyError(
                                            error instanceof Error
                                                ? error.message
                                                : "Failed to build policy"
                                        )
                                    }
                                }}
                            >
                                <Label>
                                    Name
                                    <Input
                                        onChange={(event) => setPolicyName(event.target.value)}
                                        value={policyName}
                                    />
                                </Label>
                                <Label>
                                    Description
                                    <Textarea
                                        onChange={(event) =>
                                            setPolicyDescription(event.target.value)
                                        }
                                        value={policyDescription}
                                    />
                                </Label>
                                <AccessPolicyEditor
                                    builder={policyBuilder}
                                    disabled={createPolicyMutation.isPending}
                                    onChange={setPolicyBuilder}
                                    subscriptionPlans={plansQuery.data ?? []}
                                />
                                <p className="text-sm text-[var(--muted)]">
                                    Preview: {summarizePolicyInput(policyBuilder)}
                                </p>
                                <label className="flex items-center gap-3 text-sm">
                                    <input
                                        checked={policyIsDefault}
                                        onChange={(event) =>
                                            setPolicyIsDefault(event.target.checked)
                                        }
                                        type="checkbox"
                                    />
                                    Make default
                                </label>
                                {policyError ? (
                                    <p className="text-sm text-rose-600">{policyError}</p>
                                ) : null}
                                {createPolicyMutation.isError ? (
                                    <p className="text-sm text-rose-600">
                                        {createPolicyMutation.error.message}
                                    </p>
                                ) : null}
                                <Button
                                    className="w-fit rounded-full"
                                    disabled={createPolicyMutation.isPending}
                                    type="submit"
                                >
                                    {createPolicyMutation.isPending ? "Saving..." : "Create policy"}
                                </Button>
                            </form>

                            <div className="mt-6 grid gap-3">
                                {policiesQuery.data?.map((policy) => (
                                    <div
                                        className="rounded-lg border border-[var(--line)] p-4"
                                        key={policy.id}
                                    >
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-medium">{policy.name}</span>
                                            {policy.isDefault ? (
                                                <Badge variant="success">default</Badge>
                                            ) : null}
                                            <Badge>{policy.policy.root.type}</Badge>
                                        </div>
                                        <p className="mt-2 text-sm text-[var(--muted)]">
                                            {policy.description || "No description"}
                                        </p>
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {!policy.isDefault ? (
                                                <Button
                                                    className="rounded-full"
                                                    onClick={() =>
                                                        void updatePolicyMutation.mutateAsync({
                                                            policyId: policy.id,
                                                            input: { isDefault: true },
                                                        })
                                                    }
                                                    size="sm"
                                                    type="button"
                                                    variant="outline"
                                                >
                                                    Make default
                                                </Button>
                                            ) : null}
                                            {!policy.isDefault ? (
                                                <Button
                                                    className="rounded-full"
                                                    onClick={() => {
                                                        if (window.confirm("Delete policy?")) {
                                                            void deletePolicyMutation.mutateAsync(
                                                                policy.id
                                                            )
                                                        }
                                                    }}
                                                    size="sm"
                                                    type="button"
                                                    variant="destructive"
                                                >
                                                    Delete
                                                </Button>
                                            ) : null}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </PageSection>
    )
}

function buildPlanCode(title: string) {
    const value = title
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")

    return value || "main"
}

function getTokenId(token: TokenPreset) {
    return token.address?.toLowerCase() ?? token.kind
}

function getTokenPresetByAddress(
    chainId: number,
    address: string,
    paymentAsset: "erc20" | "native" = "erc20"
) {
    if (paymentAsset === "native") {
        return getTokenPresets(chainId).find((preset) => preset.kind === "native")
    }

    return getTokenPresets(chainId).find(
        (preset) => preset.address?.toLowerCase() === address.toLowerCase()
    )
}

function toBaseUnits(amount: string, decimals: number) {
    if (!Number.isInteger(decimals) || decimals < 0 || decimals > 255) {
        return ""
    }

    try {
        return parseUnits(amount || "0", decimals).toString()
    } catch {
        return ""
    }
}

function formatPlanAmount(
    chainId: number,
    tokenAddress: string,
    price: string,
    paymentAsset: "erc20" | "native" = "erc20"
) {
    const token = getTokenPresetByAddress(chainId, tokenAddress, paymentAsset)
    const decimals = token?.decimals ?? 18
    const symbol = token?.symbol ?? "tokens"

    try {
        return `${formatUnits(BigInt(price), decimals)} ${symbol}`
    } catch {
        return `${price} ${symbol}`
    }
}
