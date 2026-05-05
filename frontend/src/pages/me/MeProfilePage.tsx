import { Link } from "react-router-dom"
import { SUBSCRIPTION_ENTITLEMENT_STATUS } from "@shared/consts"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eyebrow, PageSection, PageTitle } from "@/components/ui/page"
import { StatusPill } from "@/components/ui/status-pill"
import { useMeQuery, useMyReaderDashboardQuery } from "@/queries/profile"
import { useAuthStore } from "@/stores/auth-store"
import { formatDisplayDate } from "@/utils/date"

export function MeProfilePage() {
    const token = useAuthStore((state) => state.token)
    const meQuery = useMeQuery(Boolean(token))
    const dashboardQuery = useMyReaderDashboardQuery(Boolean(token))
    const dashboard = dashboardQuery.data
    const activeSpend = dashboard
        ? groupActiveSpendByAsset(dashboard.subscriptionsByAuthor)
        : []

    return (
        <section className="grid gap-5">
            <PageSection className="p-5 md:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <Eyebrow>reader dashboard</Eyebrow>
                        <PageTitle className="text-3xl md:text-4xl">
                            Subscriptions, spend, and upcoming renewals.
                        </PageTitle>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button asChild size="sm" variant="secondary">
                            <Link to="/me/subscriptions">Subscriptions</Link>
                        </Button>
                        <Button asChild size="sm" variant="secondary">
                            <Link to="/me/feed">Feed</Link>
                        </Button>
                        <Button asChild size="sm" variant="secondary">
                            <Link to="/me/settings">Settings</Link>
                        </Button>
                    </div>
                </div>
            </PageSection>

            {!token ? (
                <Card>
                    <CardContent className="p-5 text-[var(--muted)]">
                        Connect a wallet to open your profile.
                    </CardContent>
                </Card>
            ) : meQuery.isLoading || dashboardQuery.isLoading ? (
                <Card>
                    <CardContent className="p-5 text-[var(--muted)]">
                        Loading reader dashboard...
                    </CardContent>
                </Card>
            ) : meQuery.data && dashboard ? (
                <>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <KpiCard
                            label="Active subscriptions"
                            value={String(dashboard.counts.activeSubscriptions)}
                            detail={`${dashboard.counts.expiredSubscriptions} expired/history`}
                        />
                        <KpiCard
                            label="Monthly active spend"
                            value={formatSpendGroups(activeSpend)}
                            detail="Grouped by token and network"
                        />
                        <KpiCard
                            label="Expiring soon"
                            value={String(dashboard.counts.expiringSoon)}
                            detail="Next 14 days"
                        />
                        <KpiCard
                            label="Paid authors"
                            value={String(dashboard.counts.paidAuthors)}
                            detail={meQuery.data.primaryWallet}
                        />
                    </div>

                    <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
                        <Card>
                            <CardHeader>
                                <CardTitle>{meQuery.data.displayName}</CardTitle>
                                <CardDescription>
                                    @{meQuery.data.username ?? "username not set"}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4">
                                <div>
                                    <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                                        Wallet
                                    </div>
                                    <div className="mt-1 break-all font-mono text-sm">
                                        {meQuery.data.primaryWallet}
                                    </div>
                                </div>
                                <p className="text-sm text-[var(--muted)]">
                                    {meQuery.data.bio || "Bio is empty"}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <CardTitle>Upcoming expirations</CardTitle>
                                    <CardDescription>
                                        Active subscriptions closest to valid-until.
                                    </CardDescription>
                                </div>
                                <Button asChild size="sm" variant="secondary">
                                    <Link to="/me/subscriptions">Open all</Link>
                                </Button>
                            </CardHeader>
                            <CardContent>
                                {dashboard.upcomingExpirations.length ? (
                                    <div className="grid gap-2">
                                        {dashboard.upcomingExpirations.map((subscription) => (
                                            <div
                                                className="grid gap-2 rounded-lg border border-[var(--line)] p-3 sm:grid-cols-[1fr_auto_auto]"
                                                key={subscription.id}
                                            >
                                                <div>
                                                    <div className="font-medium">
                                                        {subscription.authorDisplayName}
                                                    </div>
                                                    <div className="text-xs text-[var(--muted)]">
                                                        {subscription.planTitle ??
                                                            subscription.planCode ??
                                                            "Subscription"}
                                                    </div>
                                                </div>
                                                <StatusPill
                                                    label={subscription.status}
                                                    variant="success"
                                                />
                                                <div className="text-sm text-[var(--muted)]">
                                                    {formatDisplayDate(subscription.validUntil)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-[var(--muted)]">
                                        No active subscriptions are expiring in the next 14 days.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </>
            ) : null}
        </section>
    )
}

function KpiCard({
    detail,
    label,
    value,
}: {
    detail: string
    label: string
    value: string
}) {
    return (
        <Card>
            <CardHeader className="p-4">
                <CardDescription>{label}</CardDescription>
                <CardTitle className="text-2xl">{value}</CardTitle>
                <p className="break-all text-xs text-[var(--muted)]">{detail}</p>
            </CardHeader>
        </Card>
    )
}

function groupActiveSpendByAsset(
    subscriptions: Array<{
        chainId: number | null
        paymentAsset: string | null
        price: string | null
        status: string
        validUntil: string
    }>
) {
    const now = Date.now()
    const buckets = new Map<string, { amount: bigint; chainId: number; paymentAsset: string }>()

    for (const subscription of subscriptions) {
        if (
            subscription.status !== SUBSCRIPTION_ENTITLEMENT_STATUS.ACTIVE ||
            new Date(subscription.validUntil).getTime() <= now ||
            !subscription.price ||
            !subscription.paymentAsset ||
            !subscription.chainId
        ) {
            continue
        }

        const key = `${subscription.chainId}:${subscription.paymentAsset}`
        const existing = buckets.get(key) ?? {
            amount: 0n,
            chainId: subscription.chainId,
            paymentAsset: subscription.paymentAsset,
        }
        existing.amount += BigInt(subscription.price)
        buckets.set(key, existing)
    }

    return Array.from(buckets.values())
}

function formatSpendGroups(
    groups: Array<{ amount: bigint; chainId: number; paymentAsset: string }>
) {
    if (!groups.length) {
        return "0"
    }

    return groups
        .map((group) => `${group.amount.toString()} ${group.paymentAsset.toUpperCase()} · ${group.chainId}`)
        .join(" · ")
}
