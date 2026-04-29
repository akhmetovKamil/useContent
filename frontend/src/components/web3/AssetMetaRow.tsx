export function AssetMetricTile({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl bg-[var(--surface-strong)] p-3">
            <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{label}</div>
            <div className="mt-1 break-words text-sm font-medium text-[var(--foreground)]">
                {value}
            </div>
        </div>
    )
}
