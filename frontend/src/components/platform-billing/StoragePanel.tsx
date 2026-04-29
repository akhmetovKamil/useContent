import type { AuthorPlatformBillingDto, AuthorPlatformCleanupPreviewDto, PlatformPlanDto } from "@shared/types/platform"
import { CreditCard, HardDrive } from "lucide-react"

import { OverQuotaPanel } from "@/components/platform-billing/OverQuotaPanel"
import { SummaryRow } from "@/components/platform-billing/SummaryRow"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRunMyAuthorPlatformCleanupMutation } from "@/queries/platform"
import { formatFileSize, formatUsdCents } from "@/utils/format"
import { GIB } from "@/utils/platform-billing"

export function StoragePanel({
    billing,
    cleanupPreview,
    extraGb,
    maxExtraGb,
    monthlyEstimateCents,
    onExtraGbChange,
    onOpenCheckout,
    plan,
}: {
    billing?: AuthorPlatformBillingDto
    cleanupPreview?: AuthorPlatformCleanupPreviewDto
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
    const isOverQuota = Boolean(billing && billing.usedStorageBytes > billing.totalStorageBytes)
    const runCleanupMutation = useRunMyAuthorPlatformCleanupMutation()

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
                            className={[
                                "h-full rounded-full transition-all",
                                isOverQuota ? "bg-rose-500" : "bg-[var(--accent)]",
                            ].join(" ")}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="mt-3 grid gap-2 text-sm text-[var(--muted)] sm:grid-cols-3">
                        <span>Posts: {formatFileSize(billing?.postsBytes ?? 0)}</span>
                        <span>Projects: {formatFileSize(billing?.projectsBytes ?? 0)}</span>
                        <span>Free: {formatFileSize(billing?.remainingStorageBytes ?? 0)}</span>
                    </div>
                </div>

                {isOverQuota ? (
                    <OverQuotaPanel
                        cleanupPreview={cleanupPreview}
                        isPending={runCleanupMutation.isPending}
                        mutationError={runCleanupMutation.error}
                        mutationResult={runCleanupMutation.data}
                        onRunCleanup={() => runCleanupMutation.mutate()}
                    />
                ) : null}

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
                    <SummaryRow label="Monthly estimate" value={formatUsdCents(monthlyEstimateCents)} />
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
