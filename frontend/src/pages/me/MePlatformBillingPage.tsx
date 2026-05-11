import type { PlatformPlanDto } from "@shared/types/platform"
import { useEffect, useState } from "react"

import { BillingStatusBadge } from "@/components/platform-billing/BillingStatusBadge"
import { CheckoutPreview } from "@/components/platform-billing/CheckoutPreview"
import { FeatureMatrix } from "@/components/platform-billing/FeatureMatrix"
import { PlanCard } from "@/components/platform-billing/PlanCard"
import { StateBanner } from "@/components/platform-billing/StateBanner"
import { StoragePanel } from "@/components/platform-billing/StoragePanel"
import { Card, CardContent } from "@/components/ui/card"
import { Drawer, DrawerContent } from "@/components/ui/drawer"
import { Eyebrow, PageSection } from "@/components/ui/page"
import {
    useMyAuthorPlatformBillingQuery,
    useMyAuthorPlatformCleanupPreviewQuery,
    usePlatformPlansQuery,
} from "@/queries/platform"
import { useAuthStore } from "@/stores/auth-store"
import { defaultSubscriptionChain } from "@/utils/config/chains"
import { bytesToGb, getDefaultTokenAddress } from "@/utils/platform-billing"

export function MePlatformBillingPage() {
    const token = useAuthStore((state) => state.token)
    const plansQuery = usePlatformPlansQuery()
    const billingQuery = useMyAuthorPlatformBillingQuery(Boolean(token))
    const cleanupPreviewQuery = useMyAuthorPlatformCleanupPreviewQuery(Boolean(token))
    const [extraGb, setExtraGb] = useState(0)
    const [checkoutPlan, setCheckoutPlan] = useState<PlatformPlanDto | null>(null)
    const [checkoutKind, setCheckoutKind] = useState<"tier" | "storage">("tier")
    const [paymentChainId, setPaymentChainId] = useState<number>(defaultSubscriptionChain.id)
    const plans = plansQuery.data ?? []
    const basicPlan = plans.find((plan) => plan.code === "basic")
    const selectedPlan = checkoutPlan ?? basicPlan ?? null
    const maxExtraGb = bytesToGb(selectedPlan?.maxExtraStorageBytes ?? 0)
    const currentExtraGb = bytesToGb(billingQuery.data?.extraStorageBytes ?? 0)
    const estimateCents =
        checkoutKind === "tier"
            ? (selectedPlan?.priceUsdCents ?? 0)
            : extraGb > currentExtraGb
              ? extraGb * (selectedPlan?.pricePerExtraGbUsdCents ?? 0)
              : 0

    useEffect(() => {
        setExtraGb(currentExtraGb)
    }, [currentExtraGb])

    function openCheckout(plan: PlatformPlanDto) {
        setCheckoutPlan(plan)
        setCheckoutKind("tier")
        setExtraGb(0)
    }

    const isInitialLoading = Boolean(token) && (plansQuery.isLoading || billingQuery.isLoading)

    return (
        <PageSection>
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <Eyebrow>platform billing</Eyebrow>
                    <h2 className="mt-3 font-[var(--serif)] text-3xl text-[var(--foreground)]">
                        Storage, plans and creator limits
                    </h2>
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                        Manage the author subscription for the platform itself. Reader subscriptions
                        stay separate: this page controls project access, storage quota and future
                        homepage promotion tools.
                    </p>
                </div>
                {billingQuery.data ? <BillingStatusBadge billing={billingQuery.data} /> : null}
            </div>

            {!token ? (
                <Card className="mt-6 rounded-[28px]">
                    <CardContent className="p-6 text-sm text-[var(--muted)]">
                        Sign in to view creator billing.
                    </CardContent>
                </Card>
            ) : null}

            {billingQuery.isError ? (
                <Card className="mt-6 rounded-[28px] border-rose-200">
                    <CardContent className="p-6 text-sm text-rose-600">
                        Failed to load billing: {billingQuery.error.message}
                    </CardContent>
                </Card>
            ) : null}

            {isInitialLoading ? (
                <PlatformBillingSkeleton />
            ) : (
                <>
                    {billingQuery.data ? <StateBanner billing={billingQuery.data} /> : null}

                    <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                        <div className="grid gap-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                {plans.map((plan) => (
                                    <PlanCard
                                        billing={billingQuery.data}
                                        key={plan.code}
                                        onOpenCheckout={() => openCheckout(plan)}
                                        plan={plan}
                                    />
                                ))}
                            </div>
                            <FeatureMatrix />
                        </div>

                        <StoragePanel
                            billing={billingQuery.data}
                            cleanupPreview={cleanupPreviewQuery.data}
                            currentExtraGb={currentExtraGb}
                            extraGb={extraGb}
                            maxExtraGb={maxExtraGb}
                            monthlyEstimateCents={estimateCents}
                            onExtraGbChange={setExtraGb}
                            onOpenCheckout={() => {
                                if (selectedPlan) {
                                    setCheckoutPlan(selectedPlan)
                                    setCheckoutKind("storage")
                                }
                            }}
                            plan={selectedPlan}
                        />
                    </div>
                </>
            )}

            <Drawer
                direction="right"
                onOpenChange={(open) => !open && setCheckoutPlan(null)}
                open={Boolean(checkoutPlan)}
            >
                <DrawerContent className="!w-[min(100vw,760px)] !max-w-none overflow-y-auto rounded-l-[32px] border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow)] sm:p-8">
                    {checkoutPlan ? (
                        <CheckoutPreview
                            chainId={paymentChainId}
                            currentExtraGb={currentExtraGb}
                            extraGb={extraGb}
                            kind={checkoutKind}
                            monthlyEstimateCents={estimateCents}
                            onChainIdChange={(chainId) => {
                                setPaymentChainId(chainId)
                            }}
                            onSuccess={() => setCheckoutPlan(null)}
                            plan={checkoutPlan}
                            tokenAddress={getDefaultTokenAddress(paymentChainId)}
                        />
                    ) : null}
                </DrawerContent>
            </Drawer>

        </PageSection>
    )
}

function PlatformBillingSkeleton() {
    return (
        <div className="mt-6 grid animate-pulse gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="grid gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                    {Array.from({ length: 2 }).map((_, index) => (
                        <Card className="rounded-[30px]" key={index}>
                            <CardContent className="grid gap-5 p-6">
                                <div className="h-6 w-28 rounded-full bg-[var(--surface-strong)]" />
                                <div className="h-10 w-36 rounded-full bg-[var(--surface-strong)]" />
                                <div className="grid gap-2">
                                    <div className="h-3 rounded-full bg-[var(--surface-strong)]" />
                                    <div className="h-3 w-4/5 rounded-full bg-[var(--surface-strong)]" />
                                </div>
                                <div className="h-11 rounded-full bg-[var(--surface-strong)]" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <Card className="rounded-[30px]">
                    <CardContent className="grid gap-3 p-6 md:grid-cols-3">
                        {Array.from({ length: 3 }).map((_, index) => (
                            <div
                                className="h-36 rounded-[24px] bg-[var(--surface-strong)]"
                                key={index}
                            />
                        ))}
                    </CardContent>
                </Card>
            </div>
            <Card className="rounded-[30px]">
                <CardContent className="grid gap-5 p-6">
                    <div className="h-14 w-3/4 rounded-full bg-[var(--surface-strong)]" />
                    <div className="h-36 rounded-[26px] bg-[var(--surface-strong)]" />
                    <div className="h-28 rounded-[26px] bg-[var(--surface-strong)]" />
                    <div className="h-12 rounded-full bg-[var(--surface-strong)]" />
                </CardContent>
            </Card>
        </div>
    )
}
