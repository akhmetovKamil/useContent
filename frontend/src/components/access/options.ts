import { Coins, KeyRound, Sparkles } from "lucide-react"

import type { AccessComposer, AccessRuleForm } from "@/utils/access-policy"

export const ruleTypeOptions: Array<{
    description: string
    icon: typeof KeyRound
    label: string
    value: AccessRuleForm["type"]
}> = [
    {
        description: "Active paid tier from your subscription plans.",
        icon: KeyRound,
        label: "Subscription",
        value: "subscription",
    },
    {
        description: "ERC-20 balance check through backend RPC.",
        icon: Coins,
        label: "Token balance",
        value: "token_balance",
    },
    {
        description: "ERC-721 or ERC-1155 ownership gate.",
        icon: Sparkles,
        label: "NFT ownership",
        value: "nft_ownership",
    },
]

export const composerOptions: Array<{ label: string; value: AccessComposer }> = [
    { label: "Single", value: "single" },
    { label: "AND", value: "and" },
    { label: "OR", value: "or" },
]
