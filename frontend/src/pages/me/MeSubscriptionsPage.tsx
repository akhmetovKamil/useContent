import { Link } from "react-router-dom"
import { SUBSCRIPTION_ENTITLEMENT_STATUS } from "@shared/consts"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eyebrow, PageSection, PageTitle } from "@/components/ui/page"
import { StatusPill } from "@/components/ui/status-pill"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useMyReaderDashboardQuery } from "@/queries/profile"
import { useAuthStore } from "@/stores/auth-store"
import { formatDisplayDate } from "@/utils/date"

export function MeSubscriptionsPage() {
    const token = useAuthStore((state) => state.token)
    const dashboardQuery = useMyReaderDashboardQuery(Boolean(token))
    const dashboard = dashboardQuery.data
    const subscriptions = dashboard?.subscriptionsByAuthor ?? []

    return (
        <section className="grid gap-5">
            <PageSection className="p-5 md:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <Eyebrow>subscriptions</Eyebrow>
                        <PageTitle className="text-3xl md:text-4xl">
                            Authors, tiers, prices, and access dates.
                        </PageTitle>
                    </div>
                    <Button asChild size="sm" variant="secondary">
                        <Link to="/me/feed">Open post feed</Link>
                    </Button>
                </div>
            </PageSection>

            <div className="grid gap-3 sm:grid-cols-3">
                <Metric
                    label="Active"
                    value={String(dashboard?.counts.activeSubscriptions ?? 0)}
                />
                <Metric
                    label="Expired/history"
                    value={String(dashboard?.counts.expiredSubscriptions ?? 0)}
                />
                <Metric label="Paid authors" value={String(dashboard?.counts.paidAuthors ?? 0)} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Subscription table</CardTitle>
                    <CardDescription>
                        Amounts stay grouped by token and chain; no USD conversion is applied.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {dashboardQuery.isLoading ? (
                        <p className="text-sm text-[var(--muted)]">Loading subscriptions...</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Author</TableHead>
                                    <TableHead>Tier</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Valid until</TableHead>
                                    <TableHead>Last payment</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {subscriptions.length ? (
                                    subscriptions.map((subscription) => (
                                        <TableRow key={subscription.id}>
                                            <TableCell>
                                                <Link
                                                    className="font-medium underline-offset-4 hover:underline"
                                                    to={`/authors/${subscription.authorSlug}`}
                                                >
                                                    {subscription.authorDisplayName}
                                                </Link>
                                                <div className="text-xs text-[var(--muted)]">
                                                    @{subscription.authorSlug}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">
                                                    {subscription.planTitle ??
                                                        subscription.planCode ??
                                                        "Subscription"}
                                                </div>
                                                <div className="text-xs text-[var(--muted)]">
                                                    {subscription.billingPeriodDays
                                                        ? `${subscription.billingPeriodDays} days`
                                                        : "Period unknown"}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {subscription.price &&
                                                subscription.paymentAsset &&
                                                subscription.chainId
                                                    ? `${subscription.price} ${subscription.paymentAsset.toUpperCase()} · ${subscription.chainId}`
                                                    : "—"}
                                            </TableCell>
                                            <TableCell>
                                                <StatusPill
                                                    label={subscription.status}
                                                    variant={
                                                        subscription.status ===
                                                        SUBSCRIPTION_ENTITLEMENT_STATUS.ACTIVE
                                                            ? "success"
                                                            : "warning"
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {formatDisplayDate(subscription.validUntil)}
                                            </TableCell>
                                            <TableCell>
                                                {subscription.lastPaymentAt
                                                    ? formatDisplayDate(subscription.lastPaymentAt)
                                                    : "—"}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex justify-end gap-2">
                                                    <Button asChild size="sm" variant="outline">
                                                        <Link
                                                            to={`/authors/${subscription.authorSlug}`}
                                                        >
                                                            Author
                                                        </Link>
                                                    </Button>
                                                    <Button asChild size="sm" variant="outline">
                                                        <Link
                                                            to={`/me/feed?author=${subscription.authorSlug}`}
                                                        >
                                                            Feed
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            className="text-center text-[var(--muted)]"
                                            colSpan={7}
                                        >
                                            You do not have subscriptions yet. Open an author page
                                            and subscribe to unlock private content.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </section>
    )
}

function Metric({ label, value }: { label: string; value: string }) {
    return (
        <Card>
            <CardHeader className="p-4">
                <CardDescription>{label}</CardDescription>
                <CardTitle className="text-2xl">{value}</CardTitle>
            </CardHeader>
        </Card>
    )
}
