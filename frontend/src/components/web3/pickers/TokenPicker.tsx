import { Check, Coins, Diamond } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { TokenLookupState, TokenPreset } from "@/types/web3"
import { cn } from "@/utils/cn"
import { getTokenPresets } from "@/utils/config/tokens"
import { getTokenId } from "@/utils/web3/tokens"

interface TokenPickerProps {
    chainId: number
    customDecimals: string
    lookup?: TokenLookupState
    onAddressChange: (address: string) => void
    onCustomDecimalsChange: (decimals: string) => void
    onTokenChange: (tokenId: string, token: TokenPreset) => void
    selectedTokenId: string
    tokenAddress: string
}

export function TokenPicker({
    chainId,
    customDecimals,
    lookup,
    onAddressChange,
    onCustomDecimalsChange,
    onTokenChange,
    selectedTokenId,
    tokenAddress,
}: TokenPickerProps) {
    const presets = getTokenPresets(chainId)
    const selectedToken = presets.find((preset) => getTokenId(preset) === selectedTokenId)

    return (
        <div className="grid gap-4 rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-4">
            <div>
                <div className="inline-flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
                    <Coins className="size-4 text-[var(--accent)]" />
                    Payment token
                </div>
                <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                    Pick a known token or connect a custom ERC-20 by address. Metadata is read from
                    the selected network when possible.
                </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
                {presets.map((preset) => (
                    <TokenOption
                        key={getTokenId(preset)}
                        onClick={() => onTokenChange(getTokenId(preset), preset)}
                        selected={selectedTokenId === getTokenId(preset)}
                        token={preset}
                    />
                ))}
            </div>

            {selectedToken?.kind === "custom" ? (
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
            ) : null}
        </div>
    )
}

function TokenOption({
    onClick,
    selected,
    token,
}: {
    onClick: () => void
    selected: boolean
    token: TokenPreset
}) {
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

function TokenLookupStateView({ lookup }: { lookup?: TokenPickerProps["lookup"] }) {
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
