import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { TokenLookupState } from "@/types/web3"

interface CustomTokenFieldsProps {
    customDecimals: string
    lookup?: TokenLookupState
    onAddressChange: (address: string) => void
    onCustomDecimalsChange: (decimals: string) => void
    tokenAddress: string
}

export function CustomTokenFields({
    customDecimals,
    lookup,
    onAddressChange,
    onCustomDecimalsChange,
    tokenAddress,
}: CustomTokenFieldsProps) {
    return (
        <div className="grid gap-3 rounded-[24px] border border-dashed border-[var(--line)] bg-[var(--surface-strong)] p-4 md:grid-cols-[1fr_140px]">
            <Label>
                ERC-20 contract address
                <Input
                    className="font-mono"
                    onChange={(event) => onAddressChange(event.target.value)}
                    placeholder="0x..."
                    value={tokenAddress}
                />
            </Label>
            <Label>
                Decimals
                <Input
                    onChange={(event) => onCustomDecimalsChange(event.target.value)}
                    value={customDecimals}
                />
            </Label>
            <div className="md:col-span-2">
                <TokenLookupStateView lookup={lookup} />
            </div>
        </div>
    )
}

function TokenLookupStateView({ lookup }: { lookup?: TokenLookupState }) {
    if (!lookup || lookup.state === "idle") {
        return (
            <p className="text-xs leading-5 text-[var(--muted)]">
                Paste a token address to read its symbol, name, and decimals automatically.
            </p>
        )
    }

    if (lookup.state === "loading") {
        return <p className="text-xs text-[var(--muted)]">Reading ERC-20 metadata...</p>
    }

    if (lookup.state === "success") {
        return (
            <p className="text-xs text-emerald-700">
                Detected {lookup.name || "token"} {lookup.symbol ? `(${lookup.symbol})` : ""}.
            </p>
        )
    }

    return <p className="text-xs text-amber-700">{lookup.error}</p>
}
