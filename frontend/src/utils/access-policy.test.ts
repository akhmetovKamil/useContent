import { describe, expect, test } from "vitest"

import {
    buildContentPolicyInput,
    buildPolicyInputFromBuilder,
    createDefaultPolicyBuilderState,
    parsePolicyToBuilder,
    summarizePolicyInput,
    type AccessPolicyBuilderState,
} from "@/utils/access-policy"

describe("access-policy utils", () => {
    test("creates a default single-rule builder", () => {
        const builder = createDefaultPolicyBuilderState()

        expect(builder.composer).toBe("single")
        expect(builder.rules).toHaveLength(1)
        expect(builder.rules[0]?.planCode).toBe("main")
    })

    test("omits policyInput when mode is not custom", () => {
        const result = buildContentPolicyInput({
            policyMode: "public",
            builder: createDefaultPolicyBuilderState(),
        })

        expect(result).toEqual({ policyMode: "public" })
    })

    test("builds a public policy input", () => {
        expect(
            buildPolicyInputFromBuilder({
                composer: "public",
                rules: [],
            }),
        ).toEqual({ root: { type: "public" } })
    })

    test("rejects single composer with more than one rule", () => {
        const builder: AccessPolicyBuilderState = {
            composer: "single",
            rules: [
                createDefaultPolicyBuilderState().rules[0]!,
                { ...createDefaultPolicyBuilderState().rules[0]!, id: "second" },
            ],
        }

        expect(() => buildPolicyInputFromBuilder(builder)).toThrowError(
            "Single mode supports exactly one rule",
        )
    })

    test("rejects and/or composer with fewer than two rules", () => {
        const builder: AccessPolicyBuilderState = {
            composer: "and",
            rules: [createDefaultPolicyBuilderState().rules[0]!],
        }

        expect(() => buildPolicyInputFromBuilder(builder)).toThrowError(
            "AND/OR modes require at least two rules",
        )
    })

    test("builds token balance node with normalized values", () => {
        const policy = buildPolicyInputFromBuilder({
            composer: "single",
            rules: [
                {
                    ...createDefaultPolicyBuilderState().rules[0]!,
                    type: "token_balance",
                    chainId: "84532",
                    contractAddress: "0xABCDEFabcdefABCDEFabcdefABCDEFabcdefABCD",
                    minAmount: "500",
                    decimals: "6",
                },
            ],
        })

        expect(policy).toEqual({
            root: {
                type: "token_balance",
                chainId: 84532,
                contractAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
                minAmount: "500",
                decimals: 6,
            },
        })
    })

    test("builds nft ownership node with optional token id and min balance", () => {
        const policy = buildPolicyInputFromBuilder({
            composer: "single",
            rules: [
                {
                    ...createDefaultPolicyBuilderState().rules[0]!,
                    type: "nft_ownership",
                    chainId: "11155111",
                    contractAddress: "0x1234567890abcdef1234567890abcdef12345678",
                    standard: "erc1155",
                    tokenId: "42",
                    minBalance: "2",
                },
            ],
        })

        expect(policy).toEqual({
            root: {
                type: "nft_ownership",
                chainId: 11155111,
                contractAddress: "0x1234567890abcdef1234567890abcdef12345678",
                standard: "erc1155",
                tokenId: "42",
                minBalance: "2",
            },
        })
    })

    test("summarizes composite rules", () => {
        const summary = summarizePolicyInput({
            composer: "or",
            rules: [
                {
                    ...createDefaultPolicyBuilderState().rules[0]!,
                    type: "subscription",
                    planCode: "bronze",
                },
                {
                    ...createDefaultPolicyBuilderState().rules[0]!,
                    id: "token",
                    type: "token_balance",
                    minAmount: "100",
                },
            ],
        })

        expect(summary).toBe("Subscription(bronze) OR Token(100)")
    })

    test("parses composite policy back into builder state", () => {
        const builder = parsePolicyToBuilder({
            version: 1,
            root: {
                type: "and",
                children: [
                    {
                        type: "token_balance",
                        chainId: 1,
                        contractAddress: "0xabcdef",
                        minAmount: "100",
                        decimals: 18,
                    },
                    {
                        type: "nft_ownership",
                        chainId: 1,
                        contractAddress: "0x123456",
                        standard: "erc721",
                        tokenId: "7",
                    },
                ],
            },
        })

        expect(builder.composer).toBe("and")
        expect(builder.rules).toHaveLength(2)
        expect(builder.rules[0]?.type).toBe("token_balance")
        expect(builder.rules[1]?.type).toBe("nft_ownership")
    })
})
