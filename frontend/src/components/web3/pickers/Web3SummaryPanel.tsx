import { ExternalLink } from "lucide-react"
import type { ReactNode } from "react"

interface Web3SummaryPanelProps {
    children?: ReactNode
    items: Array<{ label: string; value: string | null | undefined }>
    title: string
}

export function Web3SummaryPanel({ children, items, title }: Web3SummaryPanelProps) {
    return (
        <div className="grid gap-3 rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
                <ExternalLink className="size-4 text-[var(--accent)]" />
                {title}
            </div>
            <div className="grid gap-2 text-xs text-[var(--muted)]">
                {items.map((item) =>
                    item.value ? (
                        <div className="grid gap-1" key={item.label}>
                            <span className="uppercase tracking-[0.18em]">{item.label}</span>
                            <span className="break-all font-mono text-[var(--foreground)]">
                                {item.value}
                            </span>
                        </div>
                    ) : null,
                )}
            </div>
            {children}
        </div>
    )
}
