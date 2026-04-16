import {
    arbitrum,
    arbitrumSepolia,
    base,
    baseSepolia,
    optimism,
    optimismSepolia,
    sepolia,
} from "wagmi/chains"

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
}))
