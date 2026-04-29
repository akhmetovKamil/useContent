import { PAYMENT_ASSET, ZERO_ADDRESS } from "@shared/consts"
import { buildExplorerAddressUrl, buildOpenSeaAssetUrl, isNativeTokenAddress, isSameAddressLike, normalizeAddressLike } from "@shared/utils/web3"
import { formatUnits } from "viem"

import type { TokenPreset } from "@/types/web3"
import { supportedChainOptions } from "@/utils/config/chains"
import { getTokenPresets } from "@/utils/config/tokens"
import { formatUsdAmount } from "@/utils/format"

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
    const normalizedAddress = tokenAddress ? normalizeAddressLike(tokenAddress) : undefined
    const isNative = isNativeTokenAddress(normalizedAddress)
    const chain = supportedChainOptions.find((option) => option.id === chainId)
    const preset = getTokenPresets(chainId).find((token) =>
        isNative
            ? token.kind === PAYMENT_ASSET.NATIVE
            : isSameAddressLike(token.address, normalizedAddress)
    )
    return {
        address: isNative ? ZERO_ADDRESS : (preset?.address ?? normalizedAddress ?? ZERO_ADDRESS),
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
    const normalizedAddress = normalizeAddressLike(tokenAddress)
    return getTokenPresets(chainId).find((token) =>
        isNativeTokenAddress(normalizedAddress)
            ? token.kind === PAYMENT_ASSET.NATIVE
            : isSameAddressLike(token.address, normalizedAddress)
    )
}

export function getExplorerAddressUrl(chainId: number, address?: string | null) {
    return buildExplorerAddressUrl({ address, chainId })
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
    return buildOpenSeaAssetUrl({ chainId, contractAddress, tokenId })
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

export { formatUsdAmount }
