import { Coins } from "lucide-react"

import { CustomTokenFields } from "@/components/web3/pickers/CustomTokenFields"
import { TokenOptionCard } from "@/components/web3/pickers/TokenOptionCard"
import type { TokenLookupState, TokenPreset } from "@/types/web3"
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
                    <TokenOptionCard
                        key={getTokenId(preset)}
                        onClick={() => onTokenChange(getTokenId(preset), preset)}
                        selected={selectedTokenId === getTokenId(preset)}
                        token={preset}
                    />
                ))}
            </div>

            {selectedToken?.kind === "custom" ? (
                <CustomTokenFields
                    customDecimals={customDecimals}
                    lookup={lookup}
                    onAddressChange={onAddressChange}
                    onCustomDecimalsChange={onCustomDecimalsChange}
                    tokenAddress={tokenAddress}
                />
            ) : null}
        </div>
    )
}
