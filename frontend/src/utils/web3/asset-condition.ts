import { isNativeTokenAddress } from "@shared/utils/web3"

import { formatUsdAmount } from "@/utils/format"

export function getUsdEstimate(amount: string, price?: number | null) {
    if (typeof price !== "number") {
        return null
    }

    const parsed = Number(amount)
    if (!Number.isFinite(parsed)) {
        return null
    }

    return formatUsdAmount(parsed * price)
}

export function getPriceFallback(isTestnet?: boolean, isError?: boolean) {
    if (isTestnet) {
        return "testnet asset, no real price"
    }
    if (isError) {
        return "price unavailable"
    }

    return "No live price"
}

export function getTokenSwapUrl(chainId: number, tokenAddress: string) {
    const token = isNativeTokenAddress(tokenAddress) ? "ETH" : tokenAddress

    return `https://app.uniswap.org/swap?chain=${chainId}&outputCurrency=${token}`
}
