export function SummaryRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-4">
            <span className="text-[var(--muted)]">{label}</span>
            <span className="font-medium">{value}</span>
        </div>
    )
}
