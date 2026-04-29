import { ExternalLink, Gem, ImageIcon } from "lucide-react"

import { AssetMetricTile } from "@/components/web3/AssetMetaRow"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/utils/cn"
import { getChainDisplayConfig } from "@/utils/config/chains"
import { getExplorerAddressUrl, getOpenSeaAssetUrl, getTokenProgress } from "@/utils/web3/assets"

interface NftConditionAssetCardProps {
    chainId: number
    contractAddress: string
    currentBalance?: string | null
    minBalance?: string
    mode?: "author" | "reader"
    satisfied?: boolean
    standard: "erc721" | "erc1155"
    tokenId?: string
}

export function NftConditionAssetCard({
    chainId,
    contractAddress,
    currentBalance,
    minBalance,
    mode = "reader",
    satisfied,
    standard,
    tokenId,
}: NftConditionAssetCardProps) {
    const chain = getChainDisplayConfig(chainId)
    const explorerUrl = getExplorerAddressUrl(chainId, contractAddress)
    const openSeaUrl = getOpenSeaAssetUrl({ chainId, contractAddress, tokenId })
    const requiredBalance = minBalance || "1"
    const progress = mode === "reader" ? getTokenProgress(currentBalance, requiredBalance) : 0

    return (
        <article className="overflow-hidden rounded-[28px] border border-[var(--line)] bg-[var(--surface)] shadow-[0_18px_52px_rgba(15,23,42,0.06)]">
            <div
                className={cn(
                    "grid aspect-[2.2] place-items-center bg-gradient-to-br p-5 text-white",
                    chain.accent
                )}
            >
                <div className="grid size-24 place-items-center rounded-[32px] border border-white/30 bg-white/20 shadow-2xl backdrop-blur">
                    <ImageIcon className="size-10" />
                </div>
            </div>
            <div className="grid gap-4 p-5">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2 font-[var(--serif)] text-2xl text-[var(--foreground)]">
                            <Gem className="size-5 text-[var(--accent)]" />
                            {standard.toUpperCase()} pass
                        </div>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                            {tokenId ? `Token #${tokenId}` : "Any token from this collection"}
                        </p>
                    </div>
                    <Badge variant={mode === "author" || satisfied ? "success" : "warning"}>
                        {mode === "author" ? "rule asset" : satisfied ? "owned" : "missing"}
                    </Badge>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                    <AssetMetricTile label="Required" value={`${requiredBalance} NFT`} />
                    <AssetMetricTile
                        label={mode === "reader" ? "Your balance" : "Ownership check"}
                        value={
                            mode === "reader" ? `${currentBalance ?? "0"} NFT` : "Checked by RPC"
                        }
                    />
                </div>

                {mode === "reader" ? (
                    <div className="grid gap-2">
                        <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                            <span>Ownership progress</span>
                            <span>{progress}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-strong)]">
                            <div
                                className="h-full rounded-full bg-[var(--accent)] transition-all"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                ) : null}

                <div className="break-all rounded-2xl bg-[var(--surface-strong)] p-3 font-mono text-xs text-[var(--muted)]">
                    {contractAddress || "0x..."}
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button asChild className="rounded-full" size="sm" variant="outline">
                        <a href={explorerUrl} rel="noreferrer" target="_blank">
                            {chain.explorerName}
                            <ExternalLink className="size-4" />
                        </a>
                    </Button>
                    {openSeaUrl ? (
                        <Button asChild className="rounded-full" size="sm" variant="outline">
                            <a href={openSeaUrl} rel="noreferrer" target="_blank">
                                OpenSea
                                <ExternalLink className="size-4" />
                            </a>
                        </Button>
                    ) : null}
                </div>
            </div>
        </article>
    )
}
