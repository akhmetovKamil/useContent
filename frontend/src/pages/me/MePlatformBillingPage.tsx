import type { AuthorPlatformBillingDto, PlatformPlanDto } from "@contracts/types/content"
import {
    AlertTriangle,
    Check,
    Clock,
    CreditCard,
    Database,
    HardDrive,
    LockKeyhole,
    Megaphone,
    PackageCheck,
} from "lucide-react"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer"
import { Eyebrow, PageSection } from "@/components/ui/page"
import { useMyAuthorPlatformBillingQuery, usePlatformPlansQuery } from "@/queries/platform"
import { useAuthStore } from "@/stores/auth-store"
import { formatFileSize, formatUsd } from "@/utils/format"

const GIB = 1024 * 1024 * 1024

export function MePlatformBillingPage() {
    const token = useAuthStore((state) => state.token)
    const plansQuery = usePlatformPlansQuery()
    const billingQuery = useMyAuthorPlatformBillingQuery(Boolean(token))
    const [extraGb, setExtraGb] = useState(0)
    const [checkoutPlan, setCheckoutPlan] = useState<PlatformPlanDto | null>(null)
    const plans = plansQuery.data ?? []
    const basicPlan = plans.find((plan) => plan.code === "basic")
    const selectedPlan = checkoutPlan ?? basicPlan ?? null
    const maxExtraGb = bytesToGb(selectedPlan?.maxExtraStorageBytes ?? 0)
    const estimateCents =
        (selectedPlan?.priceUsdCents ?? 0) + extraGb * (selectedPlan?.pricePerExtraGbUsdCents ?? 0)

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
                                onOpenCheckout={() => {
                                    setCheckoutPlan(plan)
                                    setExtraGb(0)
                                }}
                                plan={plan}
                            />
                        ))}
                    </div>
                    <FeatureMatrix />
                </div>

                <StoragePanel
                    billing={billingQuery.data}
                    extraGb={extraGb}
                    maxExtraGb={maxExtraGb}
                    monthlyEstimateCents={estimateCents}
                    onExtraGbChange={setExtraGb}
                    plan={selectedPlan}
                    onOpenCheckout={() => {
                        if (selectedPlan) {
                            setCheckoutPlan(selectedPlan)
                        }
                    }}
                />
            </div>

            <Drawer
                onOpenChange={(open) => !open && setCheckoutPlan(null)}
                open={Boolean(checkoutPlan)}
            >
                <DrawerContent onClose={() => setCheckoutPlan(null)} side="right">
                    {checkoutPlan ? (
                        <CheckoutPreview
                            extraGb={extraGb}
                            monthlyEstimateCents={estimateCents}
                            plan={checkoutPlan}
                        />
                    ) : null}
                </DrawerContent>
            </Drawer>
        </PageSection>
    )
}

function BillingStatusBadge({ billing }: { billing: AuthorPlatformBillingDto }) {
    const variant =
        billing.status === "active" ? "success" : billing.status === "grace" ? "warning" : "default"

    return (
        <Badge className="w-fit rounded-full px-4 py-2" variant={variant}>
            {billing.plan.title} · {billing.status}
        </Badge>
    )
}

function StateBanner({ billing }: { billing: AuthorPlatformBillingDto }) {
    if (billing.status === "active") {
        return null
    }

    const isGrace = billing.status === "grace"
    const Icon = isGrace ? Clock : AlertTriangle
    const title = isGrace ? "Grace period is active" : "Free limits are active"
    const description = isGrace
        ? `Uploads are paused until renewal. You can still download or delete content until ${formatDate(
              billing.graceUntil
          )}.`
        : "If usage is above the Free quota, new uploads stay blocked until storage is reduced or the plan is renewed."

    return (
        <Card className="mt-6 rounded-[28px] border-amber-200 bg-amber-50/80 text-slate-950">
            <CardContent className="flex gap-3 p-5">
                <Icon className="mt-0.5 size-5 shrink-0 text-amber-700" />
                <div>
                    <div className="font-medium">{title}</div>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
                </div>
            </CardContent>
        </Card>
    )
}

function PlanCard({
    billing,
    onOpenCheckout,
    plan,
}: {
    billing?: AuthorPlatformBillingDto
    onOpenCheckout: () => void
    plan: PlatformPlanDto
}) {
    const isCurrent = billing?.planCode === plan.code
    const isFree = plan.code === "free"

    return (
        <Card
            className={[
                "overflow-hidden rounded-[30px] transition-colors",
                isCurrent ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "",
            ].join(" ")}
        >
            <CardHeader>
                <div className="flex items-center justify-between gap-3">
                    <Badge className="rounded-full">{plan.title}</Badge>
                    {isCurrent ? <Badge variant="success">Current</Badge> : null}
                </div>
                <CardTitle className="font-[var(--serif)] text-3xl">
                    {isFree ? "Free" : formatUsd(plan.priceUsdCents)}
                    {!isFree ? (
                        <span className="ml-1 font-sans text-sm text-[var(--muted)]">
                            / {plan.billingPeriodDays} days
                        </span>
                    ) : null}
                </CardTitle>
                <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
                <div className="grid gap-2 text-sm">
                    <FeatureRow label="Posts" active={plan.features.includes("posts")} />
                    <FeatureRow label="Projects" active={plan.features.includes("projects")} />
                    <FeatureRow
                        label="Homepage promotion"
                        active={plan.features.includes("homepage_promo")}
                    />
                </div>
                <div className="rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-4">
                    <div className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">
                        Included storage
                    </div>
                    <div className="mt-1 text-2xl font-medium">
                        {formatFileSize(plan.baseStorageBytes)}
                    </div>
                    {plan.maxExtraStorageBytes ? (
                        <p className="mt-1 text-xs text-[var(--muted)]">
                            Up to {formatFileSize(plan.maxExtraStorageBytes)} extra storage
                        </p>
                    ) : null}
                </div>
                <Button
                    className="rounded-full"
                    disabled={isFree || isCurrent}
                    onClick={onOpenCheckout}
                    type="button"
                    variant={isCurrent ? "secondary" : "default"}
                >
                    {isCurrent ? "Active now" : isFree ? "Default plan" : "Preview upgrade"}
                </Button>
            </CardContent>
        </Card>
    )
}

function FeatureRow({ active, label }: { active: boolean; label: string }) {
    const Icon = active ? Check : LockKeyhole

    return (
        <div className="flex items-center gap-2">
            <span
                className={[
                    "flex size-7 items-center justify-center rounded-full",
                    active
                        ? "bg-emerald-500/15 text-emerald-600"
                        : "bg-[var(--surface-strong)] text-[var(--muted)]",
                ].join(" ")}
            >
                <Icon className="size-3.5" />
            </span>
            <span className={active ? "text-[var(--foreground)]" : "text-[var(--muted)]"}>
                {label}
            </span>
        </div>
    )
}

function FeatureMatrix() {
    const items = [
        {
            icon: PackageCheck,
            title: "Publishing",
            text: "Free authors can keep publishing posts while project spaces stay reserved for Basic.",
        },
        {
            icon: Database,
            title: "Storage quota",
            text: "Uploads are checked against the current quota before files are written to storage.",
        },
        {
            icon: Megaphone,
            title: "Homepage promo",
            text: "A planned Basic feature for promoting selected posts on the platform home page.",
        },
    ]

    return (
        <Card className="rounded-[30px]">
            <CardHeader>
                <CardTitle>What the plan controls</CardTitle>
                <CardDescription>
                    These limits belong to author-to-platform billing, not reader subscriptions.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
                {items.map((item) => {
                    const Icon = item.icon
                    return (
                        <div
                            className="rounded-[24px] border border-[var(--line)] bg-[var(--surface-strong)] p-4"
                            key={item.title}
                        >
                            <Icon className="size-5 text-[var(--accent)]" />
                            <div className="mt-3 font-medium">{item.title}</div>
                            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                                {item.text}
                            </p>
                        </div>
                    )
                })}
            </CardContent>
        </Card>
    )
}

function StoragePanel({
    billing,
    extraGb,
    maxExtraGb,
    monthlyEstimateCents,
    onExtraGbChange,
    onOpenCheckout,
    plan,
}: {
    billing?: AuthorPlatformBillingDto
    extraGb: number
    maxExtraGb: number
    monthlyEstimateCents: number
    onExtraGbChange: (value: number) => void
    onOpenCheckout: () => void
    plan: PlatformPlanDto | null
}) {
    const used = billing?.usedStorageBytes ?? 0
    const total = billing?.totalStorageBytes ?? 1
    const progress = Math.min(100, Math.round((used / total) * 100))
    const estimatedTotal = (plan?.baseStorageBytes ?? 0) + extraGb * GIB

    return (
        <Card className="rounded-[30px] xl:sticky xl:top-6">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <span className="flex size-11 items-center justify-center rounded-2xl bg-[var(--accent-soft)]">
                        <HardDrive className="size-5 text-[var(--accent)]" />
                    </span>
                    <div>
                        <CardTitle>Storage workspace</CardTitle>
                        <CardDescription>Current usage and future extra storage.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="grid gap-5">
                <div className="rounded-[26px] border border-[var(--line)] bg-[var(--surface-strong)] p-5">
                    <div className="flex items-end justify-between gap-3">
                        <div>
                            <div className="text-sm text-[var(--muted)]">Used now</div>
                            <div className="mt-1 text-3xl font-medium">{formatFileSize(used)}</div>
                        </div>
                        <div className="text-right text-sm text-[var(--muted)]">
                            of {formatFileSize(total)}
                        </div>
                    </div>
                    <div className="mt-5 h-3 overflow-hidden rounded-full bg-[var(--line)]">
                        <div
                            className="h-full rounded-full bg-[var(--accent)] transition-all"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="mt-3 grid gap-2 text-sm text-[var(--muted)] sm:grid-cols-3">
                        <span>Posts: {formatFileSize(billing?.postsBytes ?? 0)}</span>
                        <span>Projects: {formatFileSize(billing?.projectsBytes ?? 0)}</span>
                        <span>Free: {formatFileSize(billing?.remainingStorageBytes ?? 0)}</span>
                    </div>
                </div>

                <div className="rounded-[26px] border border-[var(--line)] p-5">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <div className="font-medium">Extra storage</div>
                            <p className="mt-1 text-sm text-[var(--muted)]">
                                Choose additional space for projects and post attachments.
                            </p>
                        </div>
                        <Badge className="rounded-full">{extraGb} GB</Badge>
                    </div>
                    <input
                        className="mt-5 h-2 w-full cursor-pointer appearance-none rounded-full bg-[var(--line)] accent-[var(--accent)]"
                        disabled={!maxExtraGb}
                        max={maxExtraGb}
                        min={0}
                        onChange={(event) => onExtraGbChange(Number(event.target.value))}
                        step={1}
                        type="range"
                        value={extraGb}
                    />
                    <div className="mt-2 flex justify-between text-xs text-[var(--muted)]">
                        <span>0 GB</span>
                        <span>{maxExtraGb} GB</span>
                    </div>
                </div>

                <div className="grid gap-3 rounded-[26px] border border-[var(--line)] bg-[var(--surface-strong)] p-5 text-sm">
                    <SummaryRow label="Selected plan" value={plan?.title ?? "Basic"} />
                    <SummaryRow
                        label="Total quota after upgrade"
                        value={formatFileSize(estimatedTotal)}
                    />
                    <SummaryRow label="Monthly estimate" value={formatUsd(monthlyEstimateCents)} />
                </div>

                <Button
                    className="rounded-full"
                    disabled={!plan || plan.code === "free"}
                    onClick={onOpenCheckout}
                    type="button"
                >
                    <CreditCard className="size-4" />
                    Open payment preview
                </Button>
            </CardContent>
        </Card>
    )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-4">
            <span className="text-[var(--muted)]">{label}</span>
            <span className="font-medium">{value}</span>
        </div>
    )
}

function CheckoutPreview({
    extraGb,
    monthlyEstimateCents,
    plan,
}: {
    extraGb: number
    monthlyEstimateCents: number
    plan: PlatformPlanDto
}) {
    return (
        <div className="grid gap-6">
            <DrawerHeader>
                <Eyebrow>payment preview</Eyebrow>
                <DrawerTitle>{plan.title} creator plan</DrawerTitle>
                <DrawerDescription>
                    The real wallet payment flow comes in the next contract/backend revisions. This
                    drawer keeps the future checkout shape visible without pretending that payment
                    is already active.
                </DrawerDescription>
            </DrawerHeader>
            <Card className="rounded-[28px]">
                <CardContent className="grid gap-4 p-5">
                    <SummaryRow label="Base plan" value={formatUsd(plan.priceUsdCents)} />
                    <SummaryRow
                        label="Extra storage"
                        value={`${extraGb} GB · ${formatUsd(
                            extraGb * plan.pricePerExtraGbUsdCents
                        )}`}
                    />
                    <SummaryRow label="Total estimate" value={formatUsd(monthlyEstimateCents)} />
                    <SummaryRow
                        label="Quota after upgrade"
                        value={formatFileSize(plan.baseStorageBytes + extraGb * GIB)}
                    />
                </CardContent>
            </Card>
            <Button className="rounded-full" disabled type="button">
                On-chain payment coming next
            </Button>
        </div>
    )
}

function bytesToGb(bytes: number) {
    return Math.floor(bytes / GIB)
}

function formatDate(value: string | null) {
    if (!value) {
        return "the end of the grace period"
    }

    return new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
    }).format(new Date(value))
}
