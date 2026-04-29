export function TokenAvatar({ logoUrl, symbol }: { logoUrl?: string; symbol: string }) {
    return (
        <span className="grid size-12 place-items-center overflow-hidden rounded-2xl bg-white/20 font-mono text-sm font-semibold text-white ring-1 ring-white/30">
            {logoUrl ? (
                <img alt="" className="size-full object-cover" src={logoUrl} />
            ) : (
                symbol.slice(0, 4)
            )}
        </span>
    )
}

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
