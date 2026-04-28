import { AddressInput, ChainPicker } from "@/components/web3/Web3Pickers"
import { LabeledInput } from "@/components/access/LabeledInput"
import { NftConditionAssetCard } from "@/components/web3/AssetConditionCards"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import type { RuleEditorProps } from "@/components/access/types"
import type { AccessRuleForm } from "@/utils/access-policy"

export function NftOwnershipRuleForm({ disabled, onChange, rule }: RuleEditorProps) {
    const chainId = Number(rule.chainId)

    return (
        <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
            <div className="grid gap-4">
                <ChainPicker
                    onChange={(nextChainId) => onChange({ ...rule, chainId: String(nextChainId) })}
                    value={Number.isFinite(chainId) ? chainId : 11155111}
                />
                <AddressInput
                    description="Collection contract checked through RPC before private content is returned."
                    label="NFT collection address"
                    onChange={(value) => onChange({ ...rule, contractAddress: value })}
                    value={rule.contractAddress}
                />
                <div className="grid gap-4 md:grid-cols-3">
                    <Label>
                        Standard
                        <Select
                            disabled={disabled}
                            onValueChange={(value) =>
                                onChange({
                                    ...rule,
                                    standard: value as AccessRuleForm["standard"],
                                })
                            }
                            value={rule.standard}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="erc721">ERC-721</SelectItem>
                                <SelectItem value="erc1155">ERC-1155</SelectItem>
                            </SelectContent>
                        </Select>
                    </Label>
                    <LabeledInput
                        disabled={disabled}
                        description="Optional for ERC-721, required for ERC-1155."
                        label="Token ID"
                        onChange={(value) => onChange({ ...rule, tokenId: value })}
                        value={rule.tokenId}
                    />
                    <LabeledInput
                        disabled={disabled}
                        description="Use 1 for simple ownership."
                        label="Min balance"
                        onChange={(value) => onChange({ ...rule, minBalance: value })}
                        value={rule.minBalance}
                    />
                </div>
            </div>
            <NftConditionAssetCard
                chainId={Number.isFinite(chainId) ? chainId : 11155111}
                contractAddress={rule.contractAddress}
                minBalance={rule.minBalance}
                mode="author"
                satisfied
                standard={rule.standard}
                tokenId={rule.tokenId}
            />
        </div>
    )
}
