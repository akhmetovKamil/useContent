export interface ChainDisplayConfig {
    accent: string
    explorerName: string
    explorerUrl: string
    icon: string
    openSeaSlug?: string
    testnetOpenSeaSlug?: string
    shortName: string
}

export interface TokenPreset {
    address: `0x${string}` | null
    coingeckoId?: string
    decimals: number
    disabled?: boolean
    helper: string
    kind: "erc20" | "native" | "custom"
    logoUrl?: string
    name: string
    symbol: string
    testnet?: boolean
}

export interface TokenLookupState {
    error?: string
    name?: string
    state: "idle" | "loading" | "success" | "error"
    symbol?: string
}
