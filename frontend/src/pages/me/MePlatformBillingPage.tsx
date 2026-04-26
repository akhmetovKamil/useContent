import type { PlatformPlanDto } from "@shared/types/content"
import { useState } from "react"

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
    const [paymentChainId, setPaymentChainId] = useState<number>(defaultSubscriptionChain.id)
    const [paymentTokenAddress, setPaymentTokenAddress] = useState(() =>
        getDefaultTokenAddress(defaultSubscriptionChain.id)
    )
    const plans = plansQuery.data ?? []
    const basicPlan = plans.find((plan) => plan.code === "basic")
    const selectedPlan = checkoutPlan ?? basicPlan ?? null
    const maxExtraGb = bytesToGb(selectedPlan?.maxExtraStorageBytes ?? 0)
    const estimateCents =
        (selectedPlan?.priceUsdCents ?? 0) + extraGb * (selectedPlan?.pricePerExtraGbUsdCents ?? 0)

    function openCheckout(plan: PlatformPlanDto) {
        setCheckoutPlan(plan)
        setExtraGb(0)
        setPaymentTokenAddress(getDefaultTokenAddress(paymentChainId))
    }

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
                    extraGb={extraGb}
                    maxExtraGb={maxExtraGb}
                    monthlyEstimateCents={estimateCents}
                    onExtraGbChange={setExtraGb}
                    onOpenCheckout={() => {
                        if (selectedPlan) {
                            setCheckoutPlan(selectedPlan)
                            setPaymentTokenAddress(getDefaultTokenAddress(paymentChainId))
                        }
                    }}
                    plan={selectedPlan}
                />
            </div>

            <Drawer
                onOpenChange={(open) => !open && setCheckoutPlan(null)}
                open={Boolean(checkoutPlan)}
            >
                <DrawerContent onClose={() => setCheckoutPlan(null)} side="right">
                    {checkoutPlan ? (
                        <CheckoutPreview
                            chainId={paymentChainId}
                            extraGb={extraGb}
                            monthlyEstimateCents={estimateCents}
                            onChainIdChange={(chainId) => {
                                setPaymentChainId(chainId)
                                setPaymentTokenAddress(getDefaultTokenAddress(chainId))
                            }}
                            onSuccess={() => setCheckoutPlan(null)}
                            onTokenAddressChange={setPaymentTokenAddress}
                            plan={checkoutPlan}
                            tokenAddress={paymentTokenAddress}
                        />
                    ) : null}
                </DrawerContent>
            </Drawer>

        </PageSection>
    )
}
