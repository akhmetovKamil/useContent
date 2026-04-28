import { ACCESS_COMPOSER, ACCESS_POLICY_NODE_TYPE } from "@shared/consts"
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
        value: ACCESS_POLICY_NODE_TYPE.SUBSCRIPTION,
    },
    {
        description: "ERC-20 balance check through backend RPC.",
        icon: Coins,
        label: "Token balance",
        value: ACCESS_POLICY_NODE_TYPE.TOKEN_BALANCE,
    },
    {
        description: "ERC-721 or ERC-1155 ownership gate.",
        icon: Sparkles,
        label: "NFT ownership",
        value: ACCESS_POLICY_NODE_TYPE.NFT_OWNERSHIP,
    },
]

export const composerOptions: Array<{ label: string; value: AccessComposer }> = [
    { label: "Single", value: ACCESS_COMPOSER.SINGLE },
    { label: "AND", value: ACCESS_COMPOSER.AND },
    { label: "OR", value: ACCESS_COMPOSER.OR },
]
