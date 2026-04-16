import { useEffect, useState } from "react"

import { AccessPolicyEditor } from "@/components/access/AccessPolicyEditor"
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

export function MeSubscriptionPlanPage() {
    const token = useAuthStore((state) => state.token)
    const plansQuery = useMySubscriptionPlansQuery(Boolean(token))
    const policiesQuery = useMyAccessPoliciesQuery(Boolean(token))
    const upsertPlanMutation = useUpsertMySubscriptionPlanMutation()
    const createPolicyMutation = useCreateMyAccessPolicyMutation()
    const updatePolicyMutation = useUpdateMyAccessPolicyMutation()
    const deletePolicyMutation = useDeleteMyAccessPolicyMutation()

    const [code, setCode] = useState("main")
    const [title, setTitle] = useState("Main subscription")
    const [chainId, setChainId] = useState("11155111")
    const [tokenAddress, setTokenAddress] = useState("0x0000000000000000000000000000000000000000")
    const [price, setPrice] = useState("1000000")
    const [billingPeriodDays, setBillingPeriodDays] = useState("30")
    const [contractAddress, setContractAddress] = useState(
        "0x0000000000000000000000000000000000000000"
    )
    const [active, setActive] = useState(true)
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
        setPrice(plan.price)
        setBillingPeriodDays(String(plan.billingPeriodDays))
        setContractAddress(plan.contractAddress)
        setActive(plan.active)
    }, [plansQuery.data])

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
                                        price,
                                        billingPeriodDays: Number(billingPeriodDays),
                                        contractAddress,
                                        active,
                                    })
                                }}
                            >
                                <div className="grid gap-4 md:grid-cols-2">
                                    <Label>
                                        Code
                                        <Input
                                            onChange={(event) => setCode(event.target.value)}
                                            value={code}
                                        />
                                    </Label>
                                    <Label>
                                        Title
                                        <Input
                                            onChange={(event) => setTitle(event.target.value)}
                                            value={title}
                                        />
                                    </Label>
                                    <Label>
                                        Chain ID
                                        <Input
                                            onChange={(event) => setChainId(event.target.value)}
                                            value={chainId}
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
                                <Label>
                                    Token address
                                    <Input
                                        className="font-mono"
                                        onChange={(event) => setTokenAddress(event.target.value)}
                                        value={tokenAddress}
                                    />
                                </Label>
                                <Label>
                                    Contract address
                                    <Input
                                        className="font-mono"
                                        onChange={(event) => setContractAddress(event.target.value)}
                                        value={contractAddress}
                                    />
                                </Label>
                                <Label>
                                    Price
                                    <Input
                                        onChange={(event) => setPrice(event.target.value)}
                                        value={price}
                                    />
                                </Label>
                                <label className="flex items-center gap-3 text-sm">
                                    <input
                                        checked={active}
                                        onChange={(event) => setActive(event.target.checked)}
                                        type="checkbox"
                                    />
                                    Active
                                </label>
                                {upsertPlanMutation.isError ? (
                                    <p className="text-sm text-rose-600">
                                        {upsertPlanMutation.error.message}
                                    </p>
                                ) : null}
                                <Button
                                    className="w-fit rounded-full"
                                    disabled={upsertPlanMutation.isPending}
                                    type="submit"
                                >
                                    {upsertPlanMutation.isPending ? "Saving..." : "Save plan"}
                                </Button>
                            </form>

                            <div className="mt-6 grid gap-3">
                                {plansQuery.data?.map((plan) => (
                                    <button
                                        className="rounded-lg border border-[var(--line)] p-4 text-left transition-colors hover:bg-[var(--accent-soft)]"
                                        key={plan.id}
                                        onClick={() => {
                                            setCode(plan.code)
                                            setTitle(plan.title)
                                            setChainId(String(plan.chainId))
                                            setTokenAddress(plan.tokenAddress)
                                            setPrice(plan.price)
                                            setBillingPeriodDays(String(plan.billingPeriodDays))
                                            setContractAddress(plan.contractAddress)
                                            setActive(plan.active)
                                        }}
                                        type="button"
                                    >
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-medium">{plan.title}</span>
                                            <Badge>{plan.code}</Badge>
                                            <Badge variant={plan.active ? "success" : "warning"}>
                                                {plan.active ? "active" : "inactive"}
                                            </Badge>
                                        </div>
                                        <div className="mt-2 text-sm text-[var(--muted)]">
                                            {plan.price} every {plan.billingPeriodDays} days
                                        </div>
                                    </button>
                                ))}
                            </div>
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
