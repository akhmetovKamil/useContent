import { PAYMENT_ASSET, ZERO_ADDRESS } from "@shared/consts"

import { getTokenPresets } from "@/utils/config/tokens"

export const GIB = 1024 * 1024 * 1024

export function bytesToGb(bytes: number) {
    return Math.floor(bytes / GIB)
}

export function getDefaultTokenAddress(chainId: number): `0x${string}` {
    return (
        getTokenPresets(chainId).find((preset) => preset.kind === PAYMENT_ASSET.ERC20)?.address ??
        ZERO_ADDRESS
    )
}

export function formatBillingDate(value: string | null) {
    if (!value) {
        return "the end of the grace period"
    }

    return new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
    }).format(new Date(value))
}
