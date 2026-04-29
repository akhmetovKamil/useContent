import {
    arbitrum,
    arbitrumSepolia,
    base,
    baseSepolia,
    optimism,
    optimismSepolia,
    sepolia,
} from "wagmi/chains"
import { getEvmChainMetadata } from "@shared/utils/web3"
import type { ChainDisplayConfig } from "@/types/web3"

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
    const shared = getEvmChainMetadata(chainId)
    switch (chainId) {
        case sepolia.id:
            return {
                accent: "from-slate-400 to-indigo-500",
                explorerName: shared.explorerName,
                explorerUrl: shared.explorerUrl,
                icon: "Ξ",
                openSeaSlug: shared.openSeaSlug,
                shortName: "ETH",
                testnetOpenSeaSlug: shared.testnetOpenSeaSlug,
            }
        case baseSepolia.id:
            return {
                accent: "from-blue-500 to-cyan-400",
                explorerName: shared.explorerName,
                explorerUrl: shared.explorerUrl,
                icon: "B",
                openSeaSlug: shared.openSeaSlug,
                shortName: "Base",
                testnetOpenSeaSlug: shared.testnetOpenSeaSlug,
            }
        case base.id:
            return {
                accent: "from-blue-500 to-cyan-400",
                explorerName: shared.explorerName,
                explorerUrl: shared.explorerUrl,
                icon: "B",
                openSeaSlug: shared.openSeaSlug,
                shortName: "Base",
            }
        case optimismSepolia.id:
            return {
                accent: "from-red-500 to-orange-400",
                explorerName: shared.explorerName,
                explorerUrl: shared.explorerUrl,
                icon: "OP",
                openSeaSlug: shared.openSeaSlug,
                shortName: "OP",
                testnetOpenSeaSlug: shared.testnetOpenSeaSlug,
            }
        case optimism.id:
            return {
                accent: "from-red-500 to-orange-400",
                explorerName: shared.explorerName,
                explorerUrl: shared.explorerUrl,
                icon: "OP",
                openSeaSlug: shared.openSeaSlug,
                shortName: "OP",
            }
        case arbitrumSepolia.id:
            return {
                accent: "from-sky-500 to-blue-700",
                explorerName: shared.explorerName,
                explorerUrl: shared.explorerUrl,
                icon: "A",
                openSeaSlug: shared.openSeaSlug,
                shortName: "Arb",
                testnetOpenSeaSlug: shared.testnetOpenSeaSlug,
            }
        case arbitrum.id:
            return {
                accent: "from-sky-500 to-blue-700",
                explorerName: shared.explorerName,
                explorerUrl: shared.explorerUrl,
                icon: "A",
                openSeaSlug: shared.openSeaSlug,
                shortName: "Arb",
            }
        default:
            return {
                accent: "from-neutral-400 to-neutral-600",
                explorerName: shared.explorerName,
                explorerUrl: shared.explorerUrl,
                icon: "EVM",
                shortName: "EVM",
            }
    }
}
