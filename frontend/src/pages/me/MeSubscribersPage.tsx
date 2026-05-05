import { SUBSCRIPTION_ENTITLEMENT_STATUS } from "@shared/consts"
import { shortenWalletAddress } from "@shared/utils/web3"

import { Badge } from "@/components/ui/badge"
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
import { useMyAuthorSubscribersQuery } from "@/queries/profile"
import { useAuthStore } from "@/stores/auth-store"
import { formatDisplayDate } from "@/utils/date"

export function MeSubscribersPage() {
    const token = useAuthStore((state) => state.token)
    const subscribersQuery = useMyAuthorSubscribersQuery(Boolean(token))
    const subscribers = subscribersQuery.data ?? []
    const activeCount = subscribers.filter(
        (subscriber) => subscriber.status === SUBSCRIPTION_ENTITLEMENT_STATUS.ACTIVE
    ).length
    const subscriberCount = new Set(subscribers.map((subscriber) => subscriber.subscriberWallet))
        .size

    return (
        <section className="grid gap-5">
            <PageSection className="p-5 md:p-6">
                <Eyebrow>subscribers</Eyebrow>
                <PageTitle className="text-3xl md:text-4xl">
                    Paid access, plans, and subscriber status.
                </PageTitle>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <Metric label="Unique subscribers" value={String(subscriberCount)} />
                    <Metric label="Active subscriptions" value={String(activeCount)} />
                    <Metric
                        label="Expired/history"
                        value={String(Math.max(subscribers.length - activeCount, 0))}
                    />
                </div>
            </PageSection>

            <Card>
                <CardHeader>
                    <CardTitle>Subscriber table</CardTitle>
                    <CardDescription>
                        Access policies, plan pricing, and current validity in one view.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {subscribersQuery.isLoading ? (
                        <p className="text-sm text-[var(--muted)]">Loading subscribers...</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Subscriber</TableHead>
                                    <TableHead>Plan</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Access</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Valid until</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {subscribers.length ? (
                                    subscribers.map((subscriber) => (
                                        <TableRow key={subscriber.id}>
                                            <TableCell>
                                                <div className="font-medium">
                                                    {subscriber.subscriberDisplayName ??
                                                        shortenWalletAddress(
                                                            subscriber.subscriberWallet
                                                        )}
                                                </div>
                                                <div className="mt-1 break-all font-mono text-xs text-[var(--muted)]">
                                                    {subscriber.subscriberUsername
                                                        ? `@${subscriber.subscriberUsername}`
                                                        : subscriber.subscriberWallet}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">
                                                    {subscriber.planTitle ??
                                                        subscriber.planCode ??
                                                        "Subscription plan"}
                                                </div>
                                                <div className="text-xs text-[var(--muted)]">
                                                    {subscriber.billingPeriodDays
                                                        ? `${subscriber.billingPeriodDays} days`
                                                        : "Period unknown"}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {subscriber.price &&
                                                subscriber.paymentAsset &&
                                                subscriber.chainId
                                                    ? `${subscriber.price} ${subscriber.paymentAsset.toUpperCase()} · ${subscriber.chainId}`
                                                    : "—"}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {subscriber.accessPolicyNames.length ? (
                                                        subscriber.accessPolicyNames.map(
                                                            (policyName) => (
                                                                <Badge key={policyName}>
                                                                    {policyName}
                                                                </Badge>
                                                            )
                                                        )
                                                    ) : (
                                                        <Badge>
                                                            {subscriber.planCode ?? "plan"}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <StatusPill
                                                    label={subscriber.status}
                                                    variant={
                                                        subscriber.status ===
                                                        SUBSCRIPTION_ENTITLEMENT_STATUS.ACTIVE
                                                            ? "success"
                                                            : "warning"
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {formatDisplayDate(subscriber.validUntil)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            className="text-center text-[var(--muted)]"
                                            colSpan={6}
                                        >
                                            No subscribers yet. Publish a plan and share your
                                            author page.
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
        <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3">
            <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{label}</div>
            <div className="mt-1 text-2xl font-semibold text-[var(--foreground)]">{value}</div>
        </div>
    )
}
