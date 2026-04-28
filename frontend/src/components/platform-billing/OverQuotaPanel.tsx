import type { AuthorPlatformCleanupPreviewDto } from "@shared/types/content"
import { AlertTriangle } from "lucide-react"

import { SummaryRow } from "@/components/platform-billing/SummaryRow"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatFileSize } from "@/utils/format"

export function OverQuotaPanel({
    cleanupPreview,
    isPending,
    mutationError,
    mutationResult,
    onRunCleanup,
}: {
    cleanupPreview?: AuthorPlatformCleanupPreviewDto
    isPending: boolean
    mutationError: Error | null
    mutationResult?: { deletedBytes: number; status: string }
    onRunCleanup: () => void
}) {
    return (
        <Card className="rounded-[26px] border-rose-200 bg-rose-50 text-slate-950">
            <CardContent className="grid gap-4 p-5">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 size-5 shrink-0 text-rose-600" />
                    <div>
                        <div className="font-medium">Storage is over quota</div>
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                            Uploads stay blocked until the author renews billing, deletes files, or
                            runs cleanup after the grace period.
                        </p>
                    </div>
                </div>
                {cleanupPreview?.bytesToDelete ? (
                    <div className="grid gap-2 rounded-[20px] bg-white/70 p-4 text-sm">
                        <SummaryRow
                            label="Needs to remove"
                            value={formatFileSize(cleanupPreview.bytesToDelete)}
                        />
                        <SummaryRow
                            label="Cleanup selection"
                            value={formatFileSize(cleanupPreview.willDeleteBytes)}
                        />
                        <div className="mt-2 grid gap-2">
                            {cleanupPreview.candidates.slice(0, 3).map((item) => (
                                <div
                                    className="flex items-center justify-between gap-3 text-xs"
                                    key={`${item.kind}:${item.id}`}
                                >
                                    <span className="truncate">{item.fileName}</span>
                                    <span className="shrink-0">{formatFileSize(item.size)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : null}
                <Button
                    className="w-fit rounded-full"
                    disabled={
                        cleanupPreview?.status !== "expired" ||
                        !cleanupPreview?.bytesToDelete ||
                        isPending
                    }
                    onClick={onRunCleanup}
                    type="button"
                    variant="destructive"
                >
                    {isPending ? "Running cleanup..." : "Run safe cleanup"}
                </Button>
                {mutationResult ? (
                    <p className="text-sm text-slate-600">
                        Cleanup {mutationResult.status}: {formatFileSize(mutationResult.deletedBytes)}{" "}
                        removed.
                    </p>
                ) : null}
                {mutationError ? (
                    <p className="text-sm text-rose-700">{mutationError.message}</p>
                ) : null}
            </CardContent>
        </Card>
    )
}
