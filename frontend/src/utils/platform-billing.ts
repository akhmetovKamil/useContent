import { ZERO_ADDRESS } from "@shared/consts"
import { getPlatformUsdcToken } from "@shared/utils/platform-usdc"

export const GIB = 1024 * 1024 * 1024

export function bytesToGb(bytes: number) {
    return Math.floor(bytes / GIB)
}

export function getDefaultTokenAddress(chainId: number): `0x${string}` {
    return (getPlatformUsdcToken(chainId)?.address ?? ZERO_ADDRESS) as `0x${string}`
}

export function formatBillingDate(value: string | null) {
    if (!value) {
        return "the end of the grace period"
    }

    return new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
    }).format(new Date(value))
}
