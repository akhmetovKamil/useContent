import { ZERO_ADDRESS } from "@shared/consts"
import { ExternalLink, Gem, ImageIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useTokenUsdPriceQuery } from "@/queries/web3-assets"
import { cn } from "@/utils/cn"
import { getChainDisplayConfig } from "@/utils/config/chains"
import {
    formatTokenUnits,
    formatUsd,
    getExplorerAddressUrl,
    getOpenSeaAssetUrl,
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
                        <TokenAvatar logoUrl={token.logoUrl} symbol={token.symbol} />
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
                    <MetricTile label="Required" value={`${requiredDisplay} ${token.symbol}`} />
                    <MetricTile
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
                    <MetricTile label="Required" value={`${requiredBalance} NFT`} />
                    <MetricTile
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

function TokenAvatar({ logoUrl, symbol }: { logoUrl?: string; symbol: string }) {
    return (
        <span className="grid size-12 place-items-center overflow-hidden rounded-2xl bg-white/20 font-mono text-sm font-semibold text-white ring-1 ring-white/30">
            {logoUrl ? (
                <img alt="" className="size-full object-cover" src={logoUrl} />
            ) : (
                symbol.slice(0, 4)
            )}
        </span>
    )
}

function MetricTile({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl bg-[var(--surface-strong)] p-3">
            <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{label}</div>
            <div className="mt-1 break-words text-sm font-medium text-[var(--foreground)]">
                {value}
            </div>
        </div>
    )
}

function getUsdEstimate(amount: string, price?: number | null) {
    if (typeof price !== "number") {
        return null
    }

    const parsed = Number(amount)
    if (!Number.isFinite(parsed)) {
        return null
    }

    return formatUsd(parsed * price)
}

function getPriceFallback(isTestnet?: boolean, isError?: boolean) {
    if (isTestnet) {
        return "testnet asset, no real price"
    }
    if (isError) {
        return "price unavailable"
    }

    return "No live price"
}

function getTokenSwapUrl(chainId: number, tokenAddress: string) {
    const token =
        tokenAddress.toLowerCase() === ZERO_ADDRESS
            ? "ETH"
            : tokenAddress

    return `https://app.uniswap.org/swap?chain=${chainId}&outputCurrency=${token}`
}
