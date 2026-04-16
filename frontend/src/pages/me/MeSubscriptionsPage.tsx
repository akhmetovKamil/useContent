import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eyebrow, PageSection, PageTitle } from "@/components/ui/page"
import { useMyEntitlementsQuery } from "@/queries/profile"
import { useAuthStore } from "@/stores/auth-store"

export function MeSubscriptionsPage() {
    const token = useAuthStore((state) => state.token)
    const entitlementsQuery = useMyEntitlementsQuery(Boolean(token))
    const entitlements = entitlementsQuery.data ?? []

    return (
        <section className="grid gap-6">
            <PageSection>
                <Eyebrow>subscriptions</Eyebrow>
                <PageTitle>Your active and historical access grants.</PageTitle>
                <p className="mt-4 max-w-2xl text-[var(--muted)]">
                    This page will become the reader-side hub for renewals, author pages, and access
                    history.
                </p>
            </PageSection>

            <Card className="rounded-[28px]">
                <CardHeader>
                    <Eyebrow className="tracking-[0.3em]">total subscriptions</Eyebrow>
                    <CardTitle className="text-4xl">{entitlements.length}</CardTitle>
                </CardHeader>
                <CardContent>
                    {entitlementsQuery.isLoading ? (
                        <p className="text-sm text-[var(--muted)]">Loading subscriptions...</p>
                    ) : entitlements.length ? (
                        <div className="grid gap-3">
                            {entitlements.map((entitlement) => (
                                <article
                                    className="grid gap-3 rounded-[22px] border border-[var(--line)] bg-[var(--surface-strong)] p-4 md:grid-cols-[1fr_1fr_auto]"
                                    key={entitlement.id}
                                >
                                    <div>
                                        <div className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">
                                            author
                                        </div>
                                        <div className="mt-2 break-all font-mono text-sm">
                                            {entitlement.authorId}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">
                                            plan
                                        </div>
                                        <div className="mt-2 break-all font-mono text-sm">
                                            {entitlement.planId}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge
                                            className="rounded-full"
                                            variant={
                                                entitlement.status === "active"
                                                    ? "success"
                                                    : "warning"
                                            }
                                        >
                                            {entitlement.status}
                                        </Badge>
                                        <span className="text-sm text-[var(--muted)]">
                                            until {formatDate(entitlement.validUntil)}
                                        </span>
                                    </div>
                                </article>
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

function formatDate(value: string) {
    return new Intl.DateTimeFormat("en", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(new Date(value))
}
