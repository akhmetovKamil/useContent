import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TokenLookupStateView } from "@/components/web3/pickers/TokenLookupStateView"
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
