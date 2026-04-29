import type { TokenPreset } from "@/types/web3"

export function getTokenId(token: TokenPreset) {
    return token.address?.toLowerCase() ?? token.kind
}
