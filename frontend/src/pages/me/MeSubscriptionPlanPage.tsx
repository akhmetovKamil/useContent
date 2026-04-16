import { useEffect, useState } from "react"

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
import { getSubscriptionManagerAddress } from "@/utils/config/env"

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
    const [tokenAddress, setTokenAddress] = useState("0x0000000000000000000000000000000000000000")
    const [amount, setAmount] = useState("1000000")
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

    useEffect(() => {
        if (!plansQuery.data?.length) {
            return
        }

        const plan = plansQuery.data.find((item) => item.code === "main") ?? plansQuery.data[0]
        setCode(plan.code)
        setTitle(plan.title)
        setChainId(String(plan.chainId))
        setTokenAddress(plan.tokenAddress)
        setAmount(plan.price)
        setBillingPeriodDays(String(plan.billingPeriodDays))
        setPlanKey(plan.planKey)
        setRegistrationTxHash(plan.registrationTxHash ?? "")
    }, [plansQuery.data])

    const selectedPlan = plansQuery.data?.find((plan) => plan.code === code)
    const managerAddress =
        getSubscriptionManagerAddress(Number(chainId)) ?? selectedPlan?.contractAddress ?? ""

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
                            <form
                                className="grid gap-4"
                                onSubmit={(event) => {
                                    event.preventDefault()
                                    void upsertPlanMutation.mutateAsync({
                                        code,
                                        title,
                                        chainId: Number(chainId),
                                        tokenAddress,
                                        price: amount,
                                        billingPeriodDays: Number(billingPeriodDays),
                                        contractAddress: managerAddress,
                                        planKey: planKey || undefined,
                                        registrationTxHash: registrationTxHash || null,
                                        active: true,
                                    })
                                }}
                            >
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
                                        Chain ID
                                        <select
                                            className="h-10 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none"
                                            onChange={(event) => setChainId(event.target.value)}
                                            value={chainId}
                                        >
                                            {supportedChainOptions.map((chain) => (
                                                <option key={chain.id} value={chain.id}>
                                                    {chain.name} ({chain.id}
                                                    {chain.testnet ? ", testnet" : ""})
                                                </option>
                                            ))}
                                        </select>
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
                                <Label>
                                    Token address
                                    <Input
                                        className="font-mono"
                                        onChange={(event) => setTokenAddress(event.target.value)}
                                        value={tokenAddress}
                                    />
                                </Label>
                                <Label>
                                    Amount
                                    <Input
                                        onChange={(event) => setAmount(event.target.value)}
                                        value={amount}
                                    />
                                </Label>
                                <div className="grid gap-1 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 text-xs text-[var(--muted)]">
                                    <div>
                                        Manager:{" "}
                                        <span className="break-all font-mono">
                                            {managerAddress || "not configured for selected network"}
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
                                        Add VITE_SUBSCRIPTION_MANAGER_{chainId} after deploying the
                                        manager contract.
                                    </p>
                                ) : null}
                                <Button
                                    className="w-fit rounded-full"
                                    disabled={upsertPlanMutation.isPending || !managerAddress}
                                    type="submit"
                                >
                                    {upsertPlanMutation.isPending ? "Saving..." : "Save plan"}
                                </Button>
                                <OnChainPlanPublisher
                                    active
                                    billingPeriodDays={Number(billingPeriodDays)}
                                    chainId={Number(chainId)}
                                    code={code}
                                    contractAddress={managerAddress}
                                    disabled={upsertPlanMutation.isPending || !managerAddress}
                                    existingPlanKey={selectedPlan?.planKey}
                                    onPublished={(published) => {
                                        setPlanKey(published.planKey ?? "")
                                        setRegistrationTxHash(published.registrationTxHash ?? "")
                                        void upsertPlanMutation.mutateAsync({
                                            code,
                                            title,
                                            chainId: Number(chainId),
                                            tokenAddress,
                                            price: amount,
                                            billingPeriodDays: Number(billingPeriodDays),
                                            contractAddress: managerAddress,
                                            planKey: published.planKey,
                                            registrationTxHash: published.registrationTxHash,
                                            active: true,
                                        })
                                    }}
                                    price={amount}
                                    tokenAddress={tokenAddress}
                                />
                            </form>

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
                                                setTokenAddress(plan.tokenAddress)
                                                setAmount(plan.price)
                                                setBillingPeriodDays(String(plan.billingPeriodDays))
                                                setPlanKey(plan.planKey)
                                                setRegistrationTxHash(
                                                    plan.registrationTxHash ?? ""
                                                )
                                            }}
                                            type="button"
                                        >
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-medium">{plan.title}</span>
                                                <Badge>{plan.chainId}</Badge>
                                            </div>
                                            <div className="mt-2 text-sm text-[var(--muted)]">
                                                {plan.price} every {plan.billingPeriodDays} days
                                            </div>
                                            <div className="mt-2 break-all font-mono text-xs text-[var(--muted)]">
                                                {plan.planKey}
                                            </div>
                                        </button>
                                        <Button
                                            className="mt-3 rounded-full"
                                            disabled={deletePlanMutation.isPending}
                                            onClick={() => void deletePlanMutation.mutateAsync(plan.id)}
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
