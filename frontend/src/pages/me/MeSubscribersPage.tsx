import { SUBSCRIPTION_ENTITLEMENT_STATUS } from "@shared/consts"
import { shortenWalletAddress } from "@shared/utils"

import { ActionCard } from "@/components/ui/action-card"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eyebrow, PageSection, PageTitle } from "@/components/ui/page"
import { StatusPill } from "@/components/ui/status-pill"
import { useMyAuthorSubscribersQuery } from "@/queries/profile"
import { useAuthStore } from "@/stores/auth-store"
import { formatDisplayDate } from "@/utils/date"

export function MeSubscribersPage() {
    const token = useAuthStore((state) => state.token)
    const subscribersQuery = useMyAuthorSubscribersQuery(Boolean(token))
    const subscribers = subscribersQuery.data ?? []
    const subscriberCount = new Set(subscribers.map((subscriber) => subscriber.subscriberWallet))
        .size

    return (
        <section className="grid gap-6">
            <PageSection>
                <Eyebrow>subscribers</Eyebrow>
                <PageTitle>People with access to your paid space.</PageTitle>
                <p className="mt-4 max-w-2xl text-[var(--muted)]">
                    Track active and historical subscriptions, their plans, and reusable access
                    policies that reference those plans.
                </p>
            </PageSection>

            <Card className="rounded-[28px]">
                <CardHeader>
                    <Eyebrow className="tracking-[0.3em]">total subscribers</Eyebrow>
                    <CardTitle className="text-4xl">{subscriberCount}</CardTitle>
                </CardHeader>
                <CardContent>
                    {subscribersQuery.isLoading ? (
                        <p className="text-sm text-[var(--muted)]">Loading subscribers...</p>
                    ) : subscribers.length ? (
                        <div className="grid gap-3">
                            {subscribers.map((subscriber) => (
                                <ActionCard
                                    className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr_0.9fr]"
                                    key={subscriber.id}
                                >
                                    <div>
                                        <div className="font-medium text-[var(--foreground)]">
                                            {subscriber.subscriberDisplayName ??
                                                shortenWalletAddress(subscriber.subscriberWallet)}
                                        </div>
                                        <div className="mt-1 break-all font-mono text-xs text-[var(--muted)]">
                                            {subscriber.subscriberUsername
                                                ? `@${subscriber.subscriberUsername}`
                                                : subscriber.subscriberWallet}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">
                                            access
                                        </div>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {subscriber.accessPolicyNames.length ? (
                                                subscriber.accessPolicyNames.map((policyName) => (
                                                    <Badge
                                                        className="rounded-full"
                                                        key={policyName}
                                                    >
                                                        {policyName}
                                                    </Badge>
                                                ))
                                            ) : (
                                                <Badge className="rounded-full">
                                                    {subscriber.planTitle ??
                                                        subscriber.planCode ??
                                                        "Subscription plan"}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">
                                            status
                                        </div>
                                        <div className="mt-2 flex flex-wrap items-center gap-2">
                                            <StatusPill
                                                label={subscriber.status}
                                                variant={
                                                    subscriber.status ===
                                                    SUBSCRIPTION_ENTITLEMENT_STATUS.ACTIVE
                                                        ? "success"
                                                        : "warning"
                                                }
                                            />
                                            <span className="text-sm text-[var(--muted)]">
                                                until {formatDisplayDate(subscriber.validUntil)}
                                            </span>
                                        </div>
                                    </div>
                                </ActionCard>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-[var(--muted)]">
                            No subscribers yet. Publish a plan and share your author page.
                        </p>
                    )}
                </CardContent>
            </Card>
        </section>
    )
}
