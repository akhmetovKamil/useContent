import { SUBSCRIPTION_ENTITLEMENT_STATUS } from "@shared/consts"
import { Link } from "react-router-dom"

import { ActionCard } from "@/components/ui/action-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eyebrow, PageSection, PageTitle } from "@/components/ui/page"
import { StatusPill } from "@/components/ui/status-pill"
import { useMyReaderSubscriptionsQuery } from "@/queries/profile"
import { useAuthStore } from "@/stores/auth-store"
import { formatDisplayDate } from "@/utils/date"

export function MeSubscriptionsPage() {
    const token = useAuthStore((state) => state.token)
    const subscriptionsQuery = useMyReaderSubscriptionsQuery(Boolean(token))
    const subscriptions = subscriptionsQuery.data ?? []

    return (
        <section className="grid gap-6">
            <PageSection>
                <Eyebrow>subscriptions</Eyebrow>
                <PageTitle>Your active and historical access grants.</PageTitle>
                <p className="mt-4 max-w-2xl text-[var(--muted)]">
                    This page will become the reader-side hub for renewals, author pages, and access
                    history.
                </p>
                <Button asChild className="mt-5 rounded-full">
                    <Link to="/me/feed">Open post feed</Link>
                </Button>
            </PageSection>

            <Card className="rounded-[28px]">
                <CardHeader>
                    <Eyebrow className="tracking-[0.3em]">total subscriptions</Eyebrow>
                    <CardTitle className="text-4xl">{subscriptions.length}</CardTitle>
                </CardHeader>
                <CardContent>
                    {subscriptionsQuery.isLoading ? (
                        <p className="text-sm text-[var(--muted)]">Loading subscriptions...</p>
                    ) : subscriptions.length ? (
                        <div className="grid gap-3">
                            {subscriptions.map((subscription) => (
                                <ActionCard
                                    className="grid gap-3 md:grid-cols-[1fr_1fr_auto]"
                                    key={subscription.id}
                                >
                                    <div>
                                        <div className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">
                                            author
                                        </div>
                                        <Link
                                            className="mt-2 block text-sm font-medium underline-offset-4 hover:underline"
                                            to={`/authors/${subscription.authorSlug}/feed`}
                                        >
                                            {subscription.authorDisplayName}
                                        </Link>
                                        <div className="mt-1 font-mono text-xs text-[var(--muted)]">
                                            @{subscription.authorSlug}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">
                                            plan
                                        </div>
                                        <div className="mt-2 text-sm">
                                            {subscription.planTitle ??
                                                subscription.planCode ??
                                                "Subscription"}
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <StatusPill
                                            label={subscription.status}
                                            variant={
                                                subscription.status ===
                                                SUBSCRIPTION_ENTITLEMENT_STATUS.ACTIVE
                                                    ? "success"
                                                    : "warning"
                                            }
                                        />
                                        <span className="text-sm text-[var(--muted)]">
                                            until {formatDisplayDate(subscription.validUntil)}
                                        </span>
                                        <Button
                                            asChild
                                            className="rounded-full"
                                            size="sm"
                                            variant="outline"
                                        >
                                            <Link to={`/me/feed?author=${subscription.authorSlug}`}>
                                                Feed
                                            </Link>
                                        </Button>
                                        <Button
                                            asChild
                                            className="rounded-full"
                                            size="sm"
                                            variant="outline"
                                        >
                                            <Link to={`/authors/${subscription.authorSlug}`}>
                                                Author
                                            </Link>
                                        </Button>
                                    </div>
                                </ActionCard>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-[var(--muted)]">
                            You do not have subscriptions yet. Open an author page and subscribe to
                            unlock private content.
                        </p>
                    )}
                </CardContent>
            </Card>
        </section>
    )
}
