import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts"
import { shortenWalletAddress } from "@shared/utils/web3"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
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
import { useMyAuthorDashboardQuery, useMyAuthorProfileQuery } from "@/queries/profile"
import { useAuthStore } from "@/stores/auth-store"
import { formatDisplayDate } from "@/utils/date"

type RevenuePeriod = "month" | "year"

export function AuthorWorkspacePage() {
    const token = useAuthStore((state) => state.token)
    const [period, setPeriod] = useState<RevenuePeriod>("month")
    const authorQuery = useMyAuthorProfileQuery(Boolean(token))
    const dashboardQuery = useMyAuthorDashboardQuery(Boolean(token && authorQuery.data))
    const needsAuthorProfile = token && authorQuery.isSuccess && !authorQuery.data
    const dashboard = dashboardQuery.data
    const chartData = useMemo(
        () =>
            (dashboard?.revenueSeries[period] ?? []).map((point) => ({
                gross: sumAssetAmounts(point.assets, "grossAmount"),
                net: sumAssetAmounts(point.assets, "netAmount"),
                period: point.period,
            })),
        [dashboard, period]
    )

    return (
        <section className="grid gap-5">
            <PageSection className="p-5 md:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <Eyebrow>author dashboard</Eyebrow>
                        <PageTitle className="text-3xl md:text-4xl">
                            Revenue, subscriptions, and content at a glance.
                        </PageTitle>
                    </div>
                    {authorQuery.data ? (
                        <div className="flex flex-wrap gap-2">
                            <Button asChild size="sm" variant="secondary">
                                <Link to="/me/posts">Posts</Link>
                            </Button>
                            <Button asChild size="sm" variant="secondary">
                                <Link to="/me/projects">Projects</Link>
                            </Button>
                            <Button asChild size="sm" variant="secondary">
                                <Link to="/me/access">Access</Link>
                            </Button>
                        </div>
                    ) : null}
                </div>

                {!token ? (
                    <p className="mt-4 max-w-2xl text-[var(--muted)]">
                        Connect and sign with a wallet to open the author workspace.
                    </p>
                ) : needsAuthorProfile ? (
                    <Card className="mt-5">
                        <CardHeader>
                            <CardTitle>Become an author</CardTitle>
                            <CardDescription>
                                Create an author profile to publish posts, projects, and
                                subscription rules.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button asChild>
                                <Link to="/author/onboarding">Create author profile</Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : authorQuery.isLoading ? (
                    <p className="mt-4 text-[var(--muted)]">Loading author workspace...</p>
                ) : null}
            </PageSection>

            {authorQuery.data ? (
                dashboardQuery.isLoading ? (
                    <Card>
                        <CardContent className="p-5 text-sm text-[var(--muted)]">
                            Loading dashboard...
                        </CardContent>
                    </Card>
                ) : dashboard ? (
                    <>
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            <KpiCard
                                label="Active subscribers"
                                value={String(dashboard.counts.activeSubscribers)}
                                detail={`${dashboard.counts.uniqueSubscribers} total unique`}
                            />
                            <KpiCard
                                label="Active revenue"
                                value={formatRevenueGroups(dashboard.activeRevenueByAsset, "net")}
                                detail={`gross ${formatRevenueGroups(
                                    dashboard.activeRevenueByAsset,
                                    "gross"
                                )}`}
                            />
                            <KpiCard
                                label="Posts"
                                value={String(dashboard.counts.posts)}
                                detail="Published and draft content"
                            />
                            <KpiCard
                                label="Projects"
                                value={String(dashboard.counts.projects)}
                                detail="Author project spaces"
                            />
                        </div>

                        <div className="grid gap-5 xl:grid-cols-[1.3fr_0.9fr]">
                            <Card>
                                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <CardTitle>Revenue</CardTitle>
                                        <CardDescription>
                                            Confirmed subscription payments, grouped by selected
                                            window.
                                        </CardDescription>
                                    </div>
                                    <div className="flex rounded-lg border border-[var(--line)] p-1">
                                        {(["month", "year"] as const).map((value) => (
                                            <Button
                                                key={value}
                                                onClick={() => setPeriod(value)}
                                                size="sm"
                                                variant={period === value ? "default" : "ghost"}
                                            >
                                                {value === "month" ? "Month" : "Year"}
                                            </Button>
                                        ))}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {chartData.length ? (
                                        <ChartContainer
                                            className="h-72"
                                            config={{
                                                gross: {
                                                    color: "var(--chart-1, var(--primary))",
                                                    label: "Gross",
                                                },
                                                net: {
                                                    color: "var(--chart-2, var(--accent))",
                                                    label: "Net",
                                                },
                                            }}
                                        >
                                            <BarChart data={chartData}>
                                                <CartesianGrid vertical={false} />
                                                <XAxis
                                                    axisLine={false}
                                                    dataKey="period"
                                                    tickLine={false}
                                                    tickMargin={10}
                                                />
                                                <YAxis
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tickMargin={10}
                                                />
                                                <Tooltip content={<ChartTooltipContent />} />
                                                <Bar
                                                    dataKey="gross"
                                                    fill="var(--chart-1, var(--primary))"
                                                    radius={[4, 4, 0, 0]}
                                                />
                                                <Bar
                                                    dataKey="net"
                                                    fill="var(--chart-2, var(--accent))"
                                                    radius={[4, 4, 0, 0]}
                                                />
                                            </BarChart>
                                        </ChartContainer>
                                    ) : (
                                        <p className="py-16 text-center text-sm text-[var(--muted)]">
                                            Revenue will appear after confirmed subscription
                                            payments.
                                        </p>
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Subscription tiers</CardTitle>
                                    <CardDescription>
                                        Active and historical subscribers by plan.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Tier</TableHead>
                                                <TableHead>Price</TableHead>
                                                <TableHead className="text-right">Active</TableHead>
                                                <TableHead className="text-right">Net</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {dashboard.planBreakdown.length ? (
                                                dashboard.planBreakdown.map((plan) => (
                                                    <TableRow key={plan.planId}>
                                                        <TableCell>
                                                            <div className="font-medium">
                                                                {plan.planTitle}
                                                            </div>
                                                            <div className="text-xs text-[var(--muted)]">
                                                                {plan.planCode} · {plan.totalSubscribers} total
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            {formatAssetAmount(
                                                                plan.price,
                                                                plan.paymentAsset,
                                                                plan.chainId
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {plan.activeSubscribers}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {formatRevenueGroups(
                                                                plan.activeRevenueByAsset,
                                                                "net"
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell
                                                        className="text-center text-[var(--muted)]"
                                                        colSpan={4}
                                                    >
                                                        No subscription tiers yet.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </div>

                        <Card>
                            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <CardTitle>Recent subscribers</CardTitle>
                                    <CardDescription>
                                        Latest wallets with active or historical paid access.
                                    </CardDescription>
                                </div>
                                <Button asChild size="sm" variant="secondary">
                                    <Link to="/me/subscribers">Open subscribers</Link>
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Subscriber</TableHead>
                                            <TableHead>Tier</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Valid until</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {dashboard.recentSubscribers.length ? (
                                            dashboard.recentSubscribers.map((subscriber) => (
                                                <TableRow key={subscriber.id}>
                                                    <TableCell>
                                                        <div className="font-medium">
                                                            {subscriber.subscriberDisplayName ??
                                                                shortenWalletAddress(
                                                                    subscriber.subscriberWallet
                                                                )}
                                                        </div>
                                                        <div className="text-xs text-[var(--muted)]">
                                                            {subscriber.subscriberUsername
                                                                ? `@${subscriber.subscriberUsername}`
                                                                : shortenWalletAddress(
                                                                      subscriber.subscriberWallet
                                                                  )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge>
                                                            {subscriber.planTitle ??
                                                                subscriber.planCode ??
                                                                "Plan"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <StatusPill
                                                            label={subscriber.status}
                                                            variant={
                                                                subscriber.status === "active"
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
                                                    colSpan={4}
                                                >
                                                    No subscribers yet.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </>
                ) : null
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
                <p className="text-xs text-[var(--muted)]">{detail}</p>
            </CardHeader>
        </Card>
    )
}

function sumAssetAmounts(
    assets: Array<{ grossAmount: string; netAmount: string }>,
    key: "grossAmount" | "netAmount"
) {
    return assets.reduce((total, asset) => total + Number(asset[key] ?? 0), 0)
}

function formatRevenueGroups(
    assets: Array<{
        chainId: number
        grossAmount: string
        netAmount: string
        paymentAsset: string
    }>,
    mode: "gross" | "net"
) {
    if (!assets.length) {
        return "0"
    }

    return assets
        .map((asset) =>
            formatAssetAmount(
                mode === "gross" ? asset.grossAmount : asset.netAmount,
                asset.paymentAsset,
                asset.chainId
            )
        )
        .join(" · ")
}

function formatAssetAmount(amount: string, paymentAsset: string, chainId: number) {
    return `${amount} ${paymentAsset.toUpperCase()} · ${chainId}`
}
