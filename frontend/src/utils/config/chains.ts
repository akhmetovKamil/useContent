import {
    arbitrum,
    arbitrumSepolia,
    base,
    baseSepolia,
    optimism,
    optimismSepolia,
    sepolia,
} from "wagmi/chains"

export interface ChainDisplayConfig {
    accent: string
    explorerName: string
    explorerUrl: string
    icon: string
    openSeaSlug?: string
    testnetOpenSeaSlug?: string
    shortName: string
}

export const supportedChains = [
    sepolia,
    baseSepolia,
    optimismSepolia,
    arbitrumSepolia,
    base,
    optimism,
    arbitrum,
] as const

export const defaultSubscriptionChain = sepolia

export const supportedChainOptions = supportedChains.map((chain) => ({
    id: chain.id,
    name: chain.name,
    testnet: chain.testnet ?? false,
    ...getChainDisplayConfig(chain.id),
}))

export function getChainDisplayConfig(chainId: number): ChainDisplayConfig {
    switch (chainId) {
        case sepolia.id:
            return {
                accent: "from-slate-400 to-indigo-500",
                explorerName: "Etherscan",
                explorerUrl: "https://sepolia.etherscan.io",
                icon: "Ξ",
                openSeaSlug: "ethereum",
                shortName: "ETH",
                testnetOpenSeaSlug: "sepolia",
            }
        case baseSepolia.id:
            return {
                accent: "from-blue-500 to-cyan-400",
                explorerName: "BaseScan",
                explorerUrl: "https://sepolia.basescan.org",
                icon: "B",
                openSeaSlug: "base",
                shortName: "Base",
                testnetOpenSeaSlug: "base-sepolia",
            }
        case base.id:
            return {
                accent: "from-blue-500 to-cyan-400",
                explorerName: "BaseScan",
                explorerUrl: "https://basescan.org",
                icon: "B",
                openSeaSlug: "base",
                shortName: "Base",
            }
        case optimismSepolia.id:
            return {
                accent: "from-red-500 to-orange-400",
                explorerName: "OP Etherscan",
                explorerUrl: "https://sepolia-optimism.etherscan.io",
                icon: "OP",
                openSeaSlug: "optimism",
                shortName: "OP",
                testnetOpenSeaSlug: "optimism-sepolia",
            }
        case optimism.id:
            return {
                accent: "from-red-500 to-orange-400",
                explorerName: "OP Etherscan",
                explorerUrl: "https://optimistic.etherscan.io",
                icon: "OP",
                openSeaSlug: "optimism",
                shortName: "OP",
            }
        case arbitrumSepolia.id:
            return {
                accent: "from-sky-500 to-blue-700",
                explorerName: "Arbiscan",
                explorerUrl: "https://sepolia.arbiscan.io",
                icon: "A",
                openSeaSlug: "arbitrum",
                shortName: "Arb",
                testnetOpenSeaSlug: "arbitrum-sepolia",
            }
        case arbitrum.id:
            return {
                accent: "from-sky-500 to-blue-700",
                explorerName: "Arbiscan",
                explorerUrl: "https://arbiscan.io",
                icon: "A",
                openSeaSlug: "arbitrum",
                shortName: "Arb",
            }
        default:
            return {
                accent: "from-neutral-400 to-neutral-600",
                explorerName: "Explorer",
                explorerUrl: "https://etherscan.io",
                icon: "EVM",
                shortName: "EVM",
            }
    }
}
