import type { AuthorPlatformBillingDto, PlatformPlanDto } from "@shared/types/platform"

import { FeatureRow } from "@/components/platform-billing/FeatureRow"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { InfoMetric } from "@/components/ui/info-metric"
import { formatFileSize, formatUsd } from "@/utils/format"

export function PlanCard({
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
                <InfoMetric label="Included storage" value={formatFileSize(plan.baseStorageBytes)}>
                    {plan.maxExtraStorageBytes ? (
                        <p className="mt-1 text-xs text-[var(--muted)]">
                            Up to {formatFileSize(plan.maxExtraStorageBytes)} extra storage
                        </p>
                    ) : null}
                </InfoMetric>
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
