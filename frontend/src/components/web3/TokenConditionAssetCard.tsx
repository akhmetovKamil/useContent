import { ExternalLink } from "lucide-react"

import { AssetAvatar } from "@/components/common/AssetAvatar"
import { AssetMetricTile } from "@/components/web3/AssetMetaRow"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useTokenUsdPriceQuery } from "@/queries/web3-assets"
import { cn } from "@/utils/cn"
import { getChainDisplayConfig } from "@/utils/config/chains"
import { getPriceFallback, getTokenSwapUrl, getUsdEstimate } from "@/utils/web3/asset-condition"
import {
    formatTokenUnits,
    getTokenProgress,
    resolveTokenAssetMetadata,
} from "@/utils/web3/assets"

interface TokenConditionAssetCardProps {
    chainId: number
    contractAddress: string
    currentBalance?: string | null
    decimals: number
    minAmount: string
    mode?: "author" | "reader"
    satisfied?: boolean
}

export function TokenConditionAssetCard({
    chainId,
    contractAddress,
    currentBalance,
    decimals,
    minAmount,
    mode = "reader",
    satisfied,
}: TokenConditionAssetCardProps) {
    const token = resolveTokenAssetMetadata({ chainId, decimals, tokenAddress: contractAddress })
    const priceQuery = useTokenUsdPriceQuery(token.coingeckoId, !token.isTestnet)
    const requiredDisplay = formatTokenUnits(minAmount, token.decimals) ?? minAmount
    const currentDisplay =
        mode === "reader" ? (formatTokenUnits(currentBalance, token.decimals) ?? "0") : null
    const progress = mode === "reader" ? getTokenProgress(currentBalance, minAmount) : 0
    const requiredUsd = getUsdEstimate(requiredDisplay, priceQuery.data)
    const currentUsd = currentDisplay ? getUsdEstimate(currentDisplay, priceQuery.data) : null
    const chain = getChainDisplayConfig(chainId)

    return (
        <article className="overflow-hidden rounded-[28px] border border-[var(--line)] bg-[var(--surface)] shadow-[0_18px_52px_rgba(15,23,42,0.06)]">
            <div
                className={cn(
                    "relative overflow-hidden border-b border-white/20 bg-gradient-to-br p-5 text-white",
                    chain.accent
                )}
            >
                <div className="absolute -top-16 -right-12 size-40 rounded-full bg-white/20 blur-2xl" />
                <div className="relative flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <AssetAvatar imageUrl={token.logoUrl} label={token.symbol.slice(0, 4)} />
                        <div>
                            <div className="text-lg font-semibold">{token.symbol}</div>
                            <div className="text-sm text-white/75">{token.name}</div>
                        </div>
                    </div>
                    <Badge
                        className="bg-white/20 text-white"
                        variant={satisfied ? "success" : "warning"}
                    >
                        {mode === "author" ? "rule asset" : satisfied ? "owned" : "missing"}
                    </Badge>
                </div>
            </div>

            <div className="grid gap-4 p-5">
                <div className="grid gap-3 sm:grid-cols-2">
                    <AssetMetricTile label="Required" value={`${requiredDisplay} ${token.symbol}`} />
                    <AssetMetricTile
                        label={mode === "reader" ? "Your balance" : "Balance source"}
                        value={
                            mode === "reader"
                                ? `${currentDisplay} ${token.symbol}`
                                : "Checked with balanceOf(wallet)"
                        }
                    />
                </div>

                {mode === "reader" ? (
                    <div className="grid gap-2">
                        <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                            <span>Progress</span>
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

                <div className="grid gap-2 text-sm text-[var(--muted)]">
                    <div>
                        Required value:{" "}
                        <span className="text-[var(--foreground)]">
                            {requiredUsd ?? getPriceFallback(token.isTestnet, priceQuery.isError)}
                        </span>
                    </div>
                    {mode === "reader" ? (
                        <div>
                            Your value:{" "}
                            <span className="text-[var(--foreground)]">
                                {currentUsd ??
                                    getPriceFallback(token.isTestnet, priceQuery.isError)}
                            </span>
                        </div>
                    ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button asChild className="rounded-full" size="sm" variant="outline">
                        <a href={token.explorerUrl} rel="noreferrer" target="_blank">
                            {chain.explorerName}
                            <ExternalLink className="size-4" />
                        </a>
                    </Button>
                    <Button asChild className="rounded-full" size="sm" variant="outline">
                        <a
                            href={getTokenSwapUrl(chainId, contractAddress)}
                            rel="noreferrer"
                            target="_blank"
                        >
                            Buy / swap
                            <ExternalLink className="size-4" />
                        </a>
                    </Button>
                </div>
            </div>
        </article>
    )
}
