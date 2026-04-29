import { Check, Diamond } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { TokenPreset } from "@/types/web3"
import { cn } from "@/utils/cn"

interface TokenOptionCardProps {
    onClick: () => void
    selected: boolean
    token: TokenPreset
}

export function TokenOptionCard({ onClick, selected, token }: TokenOptionCardProps) {
    return (
        <button
            className={cn(
                "relative overflow-hidden rounded-[24px] border p-4 text-left transition duration-200 hover:-translate-y-0.5",
                selected
                    ? "border-[var(--accent)] bg-[var(--accent-soft)] shadow-[var(--shadow)]"
                    : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--accent)]",
                token.disabled && "cursor-not-allowed opacity-55",
            )}
            disabled={token.disabled}
            onClick={onClick}
            type="button"
        >
            <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-full bg-[var(--foreground)] font-mono text-xs font-semibold text-[var(--surface)]">
                    {token.logoUrl ? (
                        <img alt="" className="size-full object-cover" src={token.logoUrl} />
                    ) : token.kind === "custom" ? (
                        <Diamond className="size-4" />
                    ) : (
                        token.symbol.slice(0, 4)
                    )}
                </span>
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-[var(--foreground)]">{token.symbol}</span>
                        {selected ? <Check className="size-4 text-[var(--accent)]" /> : null}
                        {token.disabled ? <Badge>soon</Badge> : null}
                    </div>
                    <div className="mt-1 text-xs text-[var(--muted)]">{token.name}</div>
                </div>
            </div>
            <p className="mt-3 text-xs leading-5 text-[var(--muted)]">{token.helper}</p>
        </button>
    )
}
