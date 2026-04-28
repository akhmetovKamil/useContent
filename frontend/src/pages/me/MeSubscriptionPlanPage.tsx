import type { AccessPolicyPresetDto, SubscriptionPlanDto } from "@shared/types/content"
import { ZERO_ADDRESS } from "@shared/consts"
import { FileText, Plus, ShieldCheck, Sparkles } from "lucide-react"
import { useEffect, useState } from "react"
import { usePublicClient } from "wagmi"
import { formatUnits, isAddress, type Address } from "viem"

import { AccessPolicyEditor } from "@/components/access/AccessPolicyEditor"
import { FlowCard } from "@/components/access-center/FlowCard"
import { PolicyCard } from "@/components/access-center/PolicyCard"
import { SubscriptionPlanCard } from "@/components/access-center/SubscriptionPlanCard"
import { OnChainPlanPublisher } from "@/components/subscriptions/OnChainPlanPublisher"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Modal } from "@/components/ui/modal"
import { Eyebrow, PageSection } from "@/components/ui/page"
import { ErrorMessage, LoadingMessage } from "@/components/ui/query-state"
import { Textarea } from "@/components/ui/textarea"
import {
    ChainPicker,
    getTokenId,
    TokenAmountInput,
    TokenPicker,
    Web3SummaryPanel,
} from "@/components/web3/Web3Pickers"
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
    parsePolicyToBuilder,
    summarizePolicyInput,
    type AccessPolicyBuilderState,
} from "@/utils/access-policy"
import { defaultSubscriptionChain } from "@/utils/config/chains"
import { getTokenPresets } from "@/utils/config/tokens"
import {
    buildPlanCode,
    formatPlanAmount,
    getTokenPresetByAddress,
    toBaseUnits,
} from "@/utils/subscription-plan"
import { erc20Abi } from "@/utils/web3/erc20"

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

    const [planModalOpen, setPlanModalOpen] = useState(false)
    const [policyModalOpen, setPolicyModalOpen] = useState(false)
    const [editingPolicyId, setEditingPolicyId] = useState<string | null>(null)
    const [deletePolicyId, setDeletePolicyId] = useState<string | null>(null)

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
    const selectedPlan = plansQuery.data?.find((plan) => plan.code === code)
    const managerAddress =
        managerDeploymentQuery.data?.address ?? selectedPlan?.contractAddress ?? ""
    const policyOptions =
        plansQuery.data?.map((plan) => ({
            billingPeriodDays: plan.billingPeriodDays,
            chainId: plan.chainId,
            code: plan.code,
            price: formatPlanAmount(
                plan.chainId,
                plan.tokenAddress,
                plan.price,
                plan.paymentAsset ?? "erc20"
            ),
            title: plan.title,
        })) ?? []

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

    function openPlanModal(plan?: SubscriptionPlanDto) {
        if (plan) {
            fillPlanForm(plan)
        } else {
            resetPlanForm()
        }
        setPlanModalOpen(true)
    }

    function resetPlanForm() {
        const nextToken = getTokenPresets(defaultSubscriptionChain.id).find(
            (preset) => preset.kind === "erc20"
        )
        setCode("main")
        setTitle("Main subscription")
        setChainId(String(defaultSubscriptionChain.id))
        setTokenAddress(nextToken?.address ?? "")
        setSelectedTokenId(nextToken ? getTokenId(nextToken) : "custom")
        setCustomTokenDecimals(String(nextToken?.decimals ?? 18))
        setAmount("1")
        setBillingPeriodDays("30")
        setPlanKey("")
        setRegistrationTxHash("")
    }

    function fillPlanForm(plan: SubscriptionPlanDto) {
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
    }

    function openPolicyModal(policy?: AccessPolicyPresetDto) {
        setPolicyError(null)
        if (policy) {
            setEditingPolicyId(policy.id)
            setPolicyName(policy.name)
            setPolicyDescription(policy.description)
            setPolicyIsDefault(policy.isDefault)
            setPolicyBuilder(
                policy.policy.root.type === "public"
                    ? createDefaultPolicyBuilderState()
                    : parsePolicyToBuilder(policy.policy)
            )
        } else {
            setEditingPolicyId(null)
            setPolicyName("Subscribers only")
            setPolicyDescription("")
            setPolicyIsDefault(false)
            setPolicyBuilder(createDefaultPolicyBuilderState())
        }
        setPolicyModalOpen(true)
    }

    function submitPolicy() {
        setPolicyError(null)
        try {
            const input = {
                name: policyName,
                description: policyDescription,
                isDefault: policyIsDefault,
                policyInput: buildPolicyInputFromBuilder(policyBuilder),
            }

            if (editingPolicyId) {
                void updatePolicyMutation
                    .mutateAsync({ policyId: editingPolicyId, input })
                    .then(() => setPolicyModalOpen(false))
                return
            }

            void createPolicyMutation.mutateAsync(input).then(() => setPolicyModalOpen(false))
        } catch (error) {
            setPolicyError(error instanceof Error ? error.message : "Failed to build policy")
        }
    }

    return (
        <PageSection>
            <Eyebrow>Access center</Eyebrow>
            <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h2 className="font-[var(--serif)] text-3xl text-[var(--foreground)]">
                        Access policies
                    </h2>
                    <p className="mt-3 max-w-3xl text-[var(--muted)]">
                        Start with a reusable policy, then attach it to posts and projects.
                        Subscription plans are only one possible condition inside a policy.
                    </p>
                </div>
                {token ? (
                    <div className="flex flex-wrap gap-2">
                        <Button
                            className="rounded-full"
                            onClick={() => openPolicyModal()}
                            type="button"
                        >
                            <Plus className="size-4" />
                            New policy
                        </Button>
                        <Button
                            className="rounded-full"
                            onClick={() => openPlanModal()}
                            type="button"
                            variant="outline"
                        >
                            <Plus className="size-4" />
                            New subscription plan
                        </Button>
                    </div>
                ) : null}
            </div>

            {!token ? (
                <p className="mt-6 text-[var(--muted)]">
                    Subscription plans and saved access policies will appear here after sign-in.
                </p>
            ) : (
                <div className="mt-6 grid gap-6">
                    <div className="grid gap-4 lg:grid-cols-3">
                        <FlowCard
                            description="Create one rule set for a content tier."
                            icon={<ShieldCheck className="size-5" />}
                            title="1. Define policy"
                        />
                        <FlowCard
                            description="Add subscription, token balance, or NFT ownership conditions."
                            icon={<Sparkles className="size-5" />}
                            title="2. Compose conditions"
                        />
                        <FlowCard
                            description="Pick the policy when publishing posts or projects."
                            icon={<FileText className="size-5" />}
                            title="3. Attach to content"
                        />
                    </div>

                    <Card className="overflow-hidden rounded-[34px]">
                        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                                <CardTitle>Reusable policies</CardTitle>
                                <CardDescription>
                                    These are the actual access tiers users see and content uses.
                                </CardDescription>
                            </div>
                            <Button
                                className="rounded-full"
                                onClick={() => openPolicyModal()}
                                type="button"
                            >
                                <Plus className="size-4" />
                                Create policy
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {policiesQuery.isLoading ? (
                                <LoadingMessage>Loading policies...</LoadingMessage>
                            ) : policiesQuery.isError ? (
                                <ErrorMessage>{policiesQuery.error.message}</ErrorMessage>
                            ) : policiesQuery.data?.length ? (
                                <div className="grid gap-4 lg:grid-cols-2">
                                    {policiesQuery.data.map((policy) => (
                                        <PolicyCard
                                            key={policy.id}
                                            onDelete={() => setDeletePolicyId(policy.id)}
                                            onEdit={() => openPolicyModal(policy)}
                                            onMakeDefault={() =>
                                                void updatePolicyMutation.mutateAsync({
                                                    policyId: policy.id,
                                                    input: { isDefault: true },
                                                })
                                            }
                                            policy={policy}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <EmptyState
                                    action="Create first policy"
                                    description="Create a policy before publishing private content. Public content can still be selected directly on posts and projects."
                                    onAction={() => openPolicyModal()}
                                    title="No access policies yet"
                                />
                            )}
                        </CardContent>
                    </Card>

                    <Card className="rounded-[34px]">
                        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                                <CardTitle>Subscription building blocks</CardTitle>
                                <CardDescription>
                                    Plans are hidden behind policies. Create them only when a policy
                                    needs paid subscription access.
                                </CardDescription>
                            </div>
                            <Button
                                className="rounded-full"
                                onClick={() => openPlanModal()}
                                type="button"
                                variant="outline"
                            >
                                <Plus className="size-4" />
                                Create plan
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {plansQuery.isLoading ? (
                                <LoadingMessage>Loading plans...</LoadingMessage>
                            ) : plansQuery.isError ? (
                                <ErrorMessage>{plansQuery.error.message}</ErrorMessage>
                            ) : plansQuery.data?.length ? (
                                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                    {plansQuery.data.map((plan) => (
                                        <SubscriptionPlanCard
                                            key={plan.id}
                                            onDelete={() =>
                                                void deletePlanMutation.mutateAsync(plan.id)
                                            }
                                            onEdit={() => openPlanModal(plan)}
                                            plan={plan}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <EmptyState
                                    action="Create subscription plan"
                                    description="You can also create a plan from inside a subscription condition."
                                    onAction={() => openPlanModal()}
                                    title="No subscription plans yet"
                                />
                            )}
                            {deletePlanMutation.isError ? (
                                <div className="mt-3">
                                    <ErrorMessage>{deletePlanMutation.error.message}</ErrorMessage>
                                </div>
                            ) : null}
                        </CardContent>
                    </Card>
                </div>
            )}

            <Drawer onOpenChange={setPolicyModalOpen} open={policyModalOpen}>
                <DrawerContent
                    className="max-w-5xl"
                    onClose={() => setPolicyModalOpen(false)}
                    side="right"
                >
                    <DrawerHeader>
                        <DrawerTitle>
                            {editingPolicyId ? "Edit access policy" : "Create access policy"}
                        </DrawerTitle>
                        <DrawerDescription>
                            A policy is the reusable access tier that posts and projects attach to.
                        </DrawerDescription>
                    </DrawerHeader>
                    <form
                        className="mt-6 grid gap-5"
                        onSubmit={(event) => {
                            event.preventDefault()
                            submitPolicy()
                        }}
                    >
                        <div className="grid gap-4 md:grid-cols-2">
                            <Label>
                                Policy name
                                <Input
                                    onChange={(event) => setPolicyName(event.target.value)}
                                    value={policyName}
                                />
                            </Label>
                            <label className="flex items-end gap-3 rounded-[18px] border border-[var(--line)] bg-[var(--surface-strong)] p-3 text-sm">
                                <input
                                    checked={policyIsDefault}
                                    onChange={(event) => setPolicyIsDefault(event.target.checked)}
                                    type="checkbox"
                                />
                                Make this the default inherited policy
                            </label>
                        </div>
                        <Label>
                            Description
                            <Textarea
                                onChange={(event) => setPolicyDescription(event.target.value)}
                                value={policyDescription}
                            />
                        </Label>
                        <AccessPolicyEditor
                            builder={policyBuilder}
                            disabled={
                                createPolicyMutation.isPending || updatePolicyMutation.isPending
                            }
                            onChange={setPolicyBuilder}
                            onCreatePlan={() => openPlanModal()}
                            subscriptionPlans={policyOptions}
                        />
                        <div className="rounded-[22px] border border-[var(--line)] bg-[var(--surface-strong)] p-4 text-sm text-[var(--muted)]">
                            Preview: {summarizePolicyInput(policyBuilder)}
                        </div>
                        {policyError ? (
                            <p className="text-sm text-rose-600">{policyError}</p>
                        ) : null}
                        {createPolicyMutation.isError ? (
                            <p className="text-sm text-rose-600">
                                {createPolicyMutation.error.message}
                            </p>
                        ) : null}
                        {updatePolicyMutation.isError ? (
                            <p className="text-sm text-rose-600">
                                {updatePolicyMutation.error.message}
                            </p>
                        ) : null}
                        <div className="flex justify-end gap-2">
                            <Button
                                onClick={() => setPolicyModalOpen(false)}
                                type="button"
                                variant="outline"
                            >
                                Cancel
                            </Button>
                            <Button
                                disabled={
                                    createPolicyMutation.isPending || updatePolicyMutation.isPending
                                }
                                type="submit"
                            >
                                {editingPolicyId ? "Save policy" : "Create policy"}
                            </Button>
                        </div>
                    </form>
                </DrawerContent>
            </Drawer>

            <Drawer onOpenChange={setPlanModalOpen} open={planModalOpen}>
                <DrawerContent
                    className="max-w-5xl"
                    onClose={() => setPlanModalOpen(false)}
                    side="right"
                >
                    <DrawerHeader>
                        <DrawerTitle>
                            {selectedPlan ? "Edit subscription plan" : "Create subscription plan"}
                        </DrawerTitle>
                        <DrawerDescription>
                            Plans define payment amount and on-chain registration. Use them inside
                            subscription conditions.
                        </DrawerDescription>
                    </DrawerHeader>
                    <div className="mt-6 grid gap-5">
                        <div className="grid gap-4 md:grid-cols-2">
                            <Label>
                                Plan title
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
                                    onChange={(event) => setBillingPeriodDays(event.target.value)}
                                    value={billingPeriodDays}
                                />
                            </Label>
                        </div>
                        <ChainPicker
                            onChange={(nextChainId) => {
                                setChainId(String(nextChainId))
                                const nextToken = getTokenPresets(nextChainId).find(
                                    (preset) => preset.kind === "erc20"
                                )
                                setSelectedTokenId(nextToken ? getTokenId(nextToken) : "custom")
                                setTokenAddress(nextToken?.address ?? "")
                                setCustomTokenName("")
                                setCustomTokenSymbol("")
                                setCustomTokenLookupState("idle")
                                setCustomTokenLookupError("")
                            }}
                            value={selectedChainId}
                        />
                        <TokenPicker
                            chainId={selectedChainId}
                            customDecimals={customTokenDecimals}
                            lookup={{
                                error: customTokenLookupError,
                                name: customTokenName,
                                state: customTokenLookupState,
                                symbol: customTokenSymbol,
                            }}
                            onAddressChange={(value) => {
                                setTokenAddress(value)
                                setCustomTokenName("")
                                setCustomTokenSymbol("")
                            }}
                            onCustomDecimalsChange={setCustomTokenDecimals}
                            onTokenChange={(nextTokenId, preset) => {
                                setSelectedTokenId(nextTokenId)
                                setTokenAddress(
                                    preset.kind === "native" ? ZERO_ADDRESS : (preset.address ?? "")
                                )
                                setCustomTokenDecimals(String(preset.decimals))
                                setCustomTokenName("")
                                setCustomTokenSymbol("")
                                setCustomTokenLookupState("idle")
                                setCustomTokenLookupError("")
                            }}
                            selectedTokenId={selectedTokenId}
                            tokenAddress={tokenAddress}
                        />
                        <TokenAmountInput
                            amount={amount}
                            baseUnits={amountInBaseUnits}
                            onAmountChange={setAmount}
                            symbol={selectedToken?.symbol}
                        />
                        <Web3SummaryPanel
                            items={[
                                {
                                    label: "manager",
                                    value: managerDeploymentQuery.isLoading
                                        ? "loading..."
                                        : managerAddress || "not configured for selected network",
                                },
                                { label: "internal code", value: code },
                                { label: "plan key", value: planKey },
                                { label: "registration tx", value: registrationTxHash },
                            ]}
                            title="On-chain registration"
                        />
                        {upsertPlanMutation.isError ? (
                            <p className="text-sm text-rose-600">
                                {upsertPlanMutation.error.message}
                            </p>
                        ) : null}
                        {!managerAddress ? (
                            <p className="text-sm text-amber-700">
                                SubscriptionManager is not registered for this network in the
                                backend registry yet.
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
                                void upsertPlanMutation
                                    .mutateAsync({
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
                                    .then(() => setPlanModalOpen(false))
                            }}
                            price={amountInBaseUnits}
                            paymentAsset={paymentAsset}
                            tokenAddress={planTokenAddress}
                        />
                    </div>
                </DrawerContent>
            </Drawer>

            <Modal
                description="Posts and projects using this policy should be moved to another policy first."
                onOpenChange={(open) => {
                    if (!open) {
                        setDeletePolicyId(null)
                    }
                }}
                open={Boolean(deletePolicyId)}
                title="Delete access policy?"
            >
                <div className="flex justify-end gap-2">
                    <Button onClick={() => setDeletePolicyId(null)} type="button" variant="outline">
                        Cancel
                    </Button>
                    <Button
                        disabled={deletePolicyMutation.isPending}
                        onClick={() => {
                            if (!deletePolicyId) {
                                return
                            }
                            void deletePolicyMutation
                                .mutateAsync(deletePolicyId)
                                .then(() => setDeletePolicyId(null))
                        }}
                        type="button"
                        variant="destructive"
                    >
                        Delete policy
                    </Button>
                </div>
            </Modal>
        </PageSection>
    )
}
