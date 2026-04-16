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
    icon: string
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
            return { accent: "from-slate-400 to-indigo-500", icon: "Ξ", shortName: "ETH" }
        case baseSepolia.id:
        case base.id:
            return { accent: "from-blue-500 to-cyan-400", icon: "B", shortName: "Base" }
        case optimismSepolia.id:
        case optimism.id:
            return { accent: "from-red-500 to-orange-400", icon: "OP", shortName: "OP" }
        case arbitrumSepolia.id:
        case arbitrum.id:
            return { accent: "from-sky-500 to-blue-700", icon: "A", shortName: "Arb" }
        default:
            return { accent: "from-neutral-400 to-neutral-600", icon: "EVM", shortName: "EVM" }
    }
}
