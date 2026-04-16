import {
    arbitrum,
    arbitrumSepolia,
    base,
    baseSepolia,
    optimism,
    optimismSepolia,
    sepolia,
} from "wagmi/chains"

export interface TokenPreset {
    address: `0x${string}` | null
    decimals: number
    disabled?: boolean
    helper: string
    kind: "erc20" | "native" | "custom"
    name: string
    symbol: string
}

const nativeToken: TokenPreset = {
    address: null,
    decimals: 18,
    helper: "Native token.",
    kind: "native",
    name: "Native ETH",
    symbol: "ETH",
}

const customToken: TokenPreset = {
    address: null,
    decimals: 18,
    helper: "ERC-20 token address.",
    kind: "custom",
    name: "Custom ERC-20",
    symbol: "CUSTOM",
}

export function getTokenPresets(chainId: number): TokenPreset[] {
    return [nativeToken, ...getKnownTokens(chainId), customToken]
}

function getKnownTokens(chainId: number): TokenPreset[] {
    switch (chainId) {
        case sepolia.id:
            return [
                {
                    address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
                    decimals: 6,
                    helper: "Circle USDC on Sepolia.",
                    kind: "erc20",
                    name: "USDC Sepolia",
                    symbol: "USDC",
                },
            ]
        case baseSepolia.id:
            return [
                {
                    address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
                    decimals: 6,
                    helper: "Circle USDC on Base Sepolia.",
                    kind: "erc20",
                    name: "USDC Base Sepolia",
                    symbol: "USDC",
                },
            ]
        case optimismSepolia.id:
            return [
                {
                    address: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7",
                    decimals: 6,
                    helper: "Circle USDC on OP Sepolia.",
                    kind: "erc20",
                    name: "USDC OP Sepolia",
                    symbol: "USDC",
                },
            ]
        case arbitrumSepolia.id:
            return [
                {
                    address: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
                    decimals: 6,
                    helper: "Circle USDC on Arbitrum Sepolia.",
                    kind: "erc20",
                    name: "USDC Arbitrum Sepolia",
                    symbol: "USDC",
                },
            ]
        case base.id:
            return [
                {
                    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
                    decimals: 6,
                    helper: "Native USDC on Base mainnet.",
                    kind: "erc20",
                    name: "USDC Base",
                    symbol: "USDC",
                },
            ]
        case optimism.id:
            return [
                {
                    address: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
                    decimals: 6,
                    helper: "Native USDC on Optimism mainnet.",
                    kind: "erc20",
                    name: "USDC Optimism",
                    symbol: "USDC",
                },
            ]
        case arbitrum.id:
            return [
                {
                    address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
                    decimals: 6,
                    helper: "Native USDC on Arbitrum One.",
                    kind: "erc20",
                    name: "USDC Arbitrum",
                    symbol: "USDC",
                },
            ]
        default:
            return []
    }
}
