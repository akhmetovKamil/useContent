import { ZERO_ADDRESS } from "@shared/consts"
import { formatUnits } from "viem"

import { getChainDisplayConfig, supportedChainOptions } from "@/utils/config/chains"
import { getTokenPresets, type TokenPreset } from "@/utils/config/tokens"

export interface TokenAssetMetadata {
    address: string
    chainId: number
    coingeckoId?: string
    decimals: number
    explorerUrl: string
    isNative: boolean
    isTestnet?: boolean
    logoUrl?: string
    name: string
    symbol: string
}

export function resolveTokenAssetMetadata({
    chainId,
    decimals,
    tokenAddress,
}: {
    chainId: number
    decimals?: number
    tokenAddress?: string
}): TokenAssetMetadata {
    const normalizedAddress = tokenAddress?.toLowerCase() ?? ZERO_ADDRESS
    const isNative = normalizedAddress === ZERO_ADDRESS
    const chain = supportedChainOptions.find((option) => option.id === chainId)
    const preset = getTokenPresets(chainId).find((token) =>
        isNative ? token.kind === "native" : token.address?.toLowerCase() === normalizedAddress
    )
    return {
        address: isNative ? ZERO_ADDRESS : (tokenAddress ?? ZERO_ADDRESS),
        chainId,
        coingeckoId: preset?.coingeckoId,
        decimals: decimals ?? preset?.decimals ?? 18,
        explorerUrl: getExplorerAddressUrl(chainId, isNative ? ZERO_ADDRESS : tokenAddress),
        isNative,
        isTestnet: preset?.testnet ?? chain?.testnet,
        logoUrl: preset?.logoUrl,
        name: preset?.name ?? "Custom ERC-20 token",
        symbol: preset?.symbol ?? "TOKEN",
    }
}

export function findTokenPreset(chainId: number, tokenAddress: string): TokenPreset | undefined {
    const normalizedAddress = tokenAddress.toLowerCase()
    return getTokenPresets(chainId).find((token) =>
        normalizedAddress === ZERO_ADDRESS
            ? token.kind === "native"
            : token.address?.toLowerCase() === normalizedAddress
    )
}

export function getExplorerAddressUrl(chainId: number, address?: string | null) {
    const chain = getChainDisplayConfig(chainId)
    if (!address || address.toLowerCase() === ZERO_ADDRESS) {
        return chain.explorerUrl
    }

    return `${chain.explorerUrl}/address/${address}`
}

export function getOpenSeaAssetUrl({
    chainId,
    contractAddress,
    tokenId,
}: {
    chainId: number
    contractAddress: string
    tokenId?: string
}) {
    const chain = getChainDisplayConfig(chainId)
    const slug = chain.testnetOpenSeaSlug ?? chain.openSeaSlug
    if (!slug) {
        return null
    }

    const host = chain.testnetOpenSeaSlug ? "https://testnets.opensea.io" : "https://opensea.io"
    const assetPath = tokenId ? `${contractAddress}/${tokenId}` : contractAddress

    return `${host}/assets/${slug}/${assetPath}`
}

export function formatTokenUnits(value: string | null | undefined, decimals: number) {
    if (!value) {
        return null
    }

    try {
        return formatUnits(BigInt(value), decimals)
    } catch {
        return value
    }
}

export function getTokenProgress(current: string | null | undefined, required: string) {
    if (!current) {
        return 0
    }

    try {
        const currentValue = BigInt(current)
        const requiredValue = BigInt(required)
        if (requiredValue <= 0n) {
            return 100
        }

        return Math.min(Number((currentValue * 100n) / requiredValue), 100)
    } catch {
        return 0
    }
}

export function formatUsd(value: number | null | undefined) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
        return null
    }

    return new Intl.NumberFormat("en", {
        currency: "USD",
        maximumFractionDigits: value >= 1 ? 2 : 6,
        style: "currency",
    }).format(value)
}
