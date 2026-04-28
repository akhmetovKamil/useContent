import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface TokenAmountInputProps {
    amount: string
    baseUnits: string
    onAmountChange: (amount: string) => void
    symbol?: string
}

export function TokenAmountInput({
    amount,
    baseUnits,
    onAmountChange,
    symbol,
}: TokenAmountInputProps) {
    return (
        <div className="rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-4">
            <Label>
                Subscription amount
                <div className="relative mt-1">
                    <Input
                        className="h-14 rounded-2xl pr-24 text-lg"
                        onChange={(event) => onAmountChange(event.target.value)}
                        placeholder="10"
                        value={amount}
                    />
                    <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 font-mono text-xs text-[var(--muted)]">
                        {symbol ?? "TOKEN"}
                    </span>
                </div>
            </Label>
            <div className="mt-3 rounded-2xl bg-[var(--surface-strong)] px-3 py-2 text-xs text-[var(--muted)]">
                On-chain value: <span className="break-all font-mono">{baseUnits || "0"}</span>
            </div>
        </div>
    )
}
