import { PAYMENT_ASSET, type PaymentAsset } from "@shared/consts"
import { isSameAddressLike } from "@shared/utils"
import { formatUnits, parseUnits } from "viem"

import { getTokenPresets } from "@/utils/config/tokens"

export function buildPlanCode(title: string) {
    const value = title
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")

    return value || "main"
}

export function getTokenPresetByAddress(
    chainId: number,
    address: string,
    paymentAsset: PaymentAsset = PAYMENT_ASSET.ERC20
) {
    if (paymentAsset === PAYMENT_ASSET.NATIVE) {
        return getTokenPresets(chainId).find((preset) => preset.kind === PAYMENT_ASSET.NATIVE)
    }

    return getTokenPresets(chainId).find((preset) => isSameAddressLike(preset.address, address))
}

export function toBaseUnits(amount: string, decimals: number) {
    if (!Number.isInteger(decimals) || decimals < 0 || decimals > 255) {
        return ""
    }

    try {
        return parseUnits(amount || "0", decimals).toString()
    } catch {
        return ""
    }
}

export function formatPlanAmount(
    chainId: number,
    tokenAddress: string,
    price: string,
    paymentAsset: PaymentAsset = PAYMENT_ASSET.ERC20
) {
    const token = getTokenPresetByAddress(chainId, tokenAddress, paymentAsset)
    const decimals = token?.decimals ?? 18
    const symbol = token?.symbol ?? "tokens"

    try {
        return `${formatUnits(BigInt(price), decimals)} ${symbol}`
    } catch {
        return `${price} ${symbol}`
    }
}
