import { AddressInput } from "@/components/web3/pickers/AddressInput"
import { ChainPicker } from "@/components/web3/pickers/ChainPicker"
import { LabeledInput } from "@/components/access/LabeledInput"
import { TokenConditionAssetCard } from "@/components/web3/TokenConditionAssetCard"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/utils/cn"
import { getChainDisplayConfig } from "@/utils/config/chains"
import type { RuleEditorProps } from "@/components/access/types"

export function TokenBalanceRuleForm({ disabled, onChange, rule }: RuleEditorProps) {
    const chainId = Number(rule.chainId)
    const chainConfig = Number.isFinite(chainId) ? getChainDisplayConfig(chainId) : null

    return (
        <div className="grid gap-4">
            <ChainPicker
                onChange={(nextChainId) => onChange({ ...rule, chainId: String(nextChainId) })}
                value={Number.isFinite(chainId) ? chainId : 11155111}
            />
            <div className="grid gap-4 md:grid-cols-[1fr_220px]">
                <AddressInput
                    description="The backend reads ERC-20 balanceOf(viewerWallet) on this contract."
                    label="ERC-20 contract address"
                    onChange={(value) => onChange({ ...rule, contractAddress: value })}
                    value={rule.contractAddress}
                />
                <LabeledInput
                    disabled={disabled}
                    label="Decimals"
                    onChange={(value) => onChange({ ...rule, decimals: value })}
                    value={rule.decimals}
                />
            </div>
            <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
                <div
                    className={cn(
                        "overflow-hidden rounded-[28px] border border-[var(--line)] bg-gradient-to-br p-4",
                        chainConfig?.accent ?? "from-slate-400 to-neutral-700"
                    )}
                >
                    <Label className="text-white">
                        Minimum token balance
                        <Input
                            className="mt-2 h-14 rounded-2xl border-white/30 bg-white/20 font-mono text-lg text-white placeholder:text-white/60"
                            disabled={disabled}
                            onChange={(event) =>
                                onChange({ ...rule, minAmount: event.target.value })
                            }
                            placeholder="1000000"
                            value={rule.minAmount}
                        />
                        <span className="mt-2 block text-xs leading-5 text-white/80">
                            Raw token units. Example: 1000000 for 1 USDC with 6 decimals.
                        </span>
                    </Label>
                </div>
                <TokenConditionAssetCard
                    chainId={Number.isFinite(chainId) ? chainId : 11155111}
                    contractAddress={rule.contractAddress}
                    decimals={Number(rule.decimals) || 18}
                    minAmount={rule.minAmount || "0"}
                    mode="author"
                    satisfied
                />
            </div>
        </div>
    )
}
