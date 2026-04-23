import { describe, expect, test } from "vitest"

import {
    findTokenPreset,
    formatTokenUnits,
    formatUsd,
    getExplorerAddressUrl,
    getOpenSeaAssetUrl,
    getTokenProgress,
    resolveTokenAssetMetadata,
} from "@/utils/web3/assets"

describe("web3 asset helpers", () => {
    test("resolves native ETH metadata on sepolia", () => {
        const asset = resolveTokenAssetMetadata({
            chainId: 11155111,
            tokenAddress: "0x0000000000000000000000000000000000000000",
        })

        expect(asset.isNative).toBe(true)
        expect(asset.symbol).toBe("ETH")
        expect(asset.explorerUrl).toBe("https://sepolia.etherscan.io")
    })

    test("resolves known USDC preset on base sepolia", () => {
        const asset = resolveTokenAssetMetadata({
            chainId: 84532,
            tokenAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
        })

        expect(asset.symbol).toBe("USDC")
        expect(asset.decimals).toBe(6)
        expect(asset.coingeckoId).toBe("usd-coin")
    })

    test("falls back to custom token metadata", () => {
        const asset = resolveTokenAssetMetadata({
            chainId: 84532,
            tokenAddress: "0x1111111111111111111111111111111111111111",
            decimals: 8,
        })

        expect(asset.name).toBe("Custom ERC-20 token")
        expect(asset.symbol).toBe("TOKEN")
        expect(asset.decimals).toBe(8)
    })

    test("finds token preset by chain and address", () => {
        const preset = findTokenPreset(
            11155111,
            "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
        )

        expect(preset?.symbol).toBe("USDC")
    })

    test("returns chain explorer root for zero address", () => {
        expect(
            getExplorerAddressUrl(
                11155111,
                "0x0000000000000000000000000000000000000000",
            ),
        ).toBe("https://sepolia.etherscan.io")
    })

    test("builds opensea asset url for testnet nft", () => {
        expect(
            getOpenSeaAssetUrl({
                chainId: 84532,
                contractAddress: "0xabc",
                tokenId: "42",
            }),
        ).toBe("https://testnets.opensea.io/assets/base-sepolia/0xabc/42")
    })

    test("formats token units and falls back on invalid input", () => {
        expect(formatTokenUnits("1000000", 6)).toBe("1")
        expect(formatTokenUnits("not-a-number", 6)).toBe("not-a-number")
        expect(formatTokenUnits(null, 6)).toBeNull()
    })

    test("computes token progress and clamps to 100", () => {
        expect(getTokenProgress("50", "100")).toBe(50)
        expect(getTokenProgress("500", "100")).toBe(100)
        expect(getTokenProgress(null, "100")).toBe(0)
    })

    test("formats usd or returns null for invalid values", () => {
        expect(formatUsd(12.5)).toBe("$12.50")
        expect(formatUsd(Number.NaN)).toBeNull()
        expect(formatUsd(undefined)).toBeNull()
    })
})
