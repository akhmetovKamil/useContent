import type { AccessPolicyConditionDto, AuthorAccessPolicyDto } from "@shared/types/content"

import { formatTokenUnits, resolveTokenAssetMetadata } from "@/utils/web3/assets"

export function describeConditionMode(mode: AuthorAccessPolicyDto["conditionMode"]) {
    if (mode === "and") {
        return "Every condition below must be satisfied."
    }
    if (mode === "or") {
        return "Any condition below can unlock this tier."
    }

    return "This tier uses one condition."
}

export function formatConditionChip(condition: AccessPolicyConditionDto) {
    switch (condition.type) {
        case "subscription":
            return "Subscription"
        case "token_balance":
            return "Token"
        case "nft_ownership":
            return "NFT"
        default:
            return "Rule"
    }
}

export function getConditionTitle(condition: AccessPolicyConditionDto) {
    switch (condition.type) {
        case "subscription":
            return condition.plan.title
        case "token_balance":
            return "Token balance"
        case "nft_ownership":
            return `${condition.standard.toUpperCase()} ownership`
        default:
            return "Condition"
    }
}

export function getConditionDescription(condition: AccessPolicyConditionDto) {
    switch (condition.type) {
        case "subscription":
            return `${formatPlanPrice(
                condition.plan.chainId,
                condition.plan.tokenAddress,
                condition.plan.price
            )} every ${condition.plan.billingPeriodDays} days.`
        case "token_balance": {
            const token = resolveTokenAssetMetadata({
                chainId: condition.chainId,
                decimals: condition.decimals,
                tokenAddress: condition.contractAddress,
            })
            const required = formatTokenUnits(condition.minAmount, condition.decimals)
            const current = formatTokenUnits(condition.currentBalance, condition.decimals)

            return `Requires ${required ?? condition.minAmount} ${token.symbol}. Current balance: ${
                current ? `${current} ${token.symbol}` : "not detected"
            }.`
        }
        case "nft_ownership":
            return `Requires ${condition.tokenId ? `token #${condition.tokenId}` : "collection ownership"} on chain ${
                condition.chainId
            }. Current balance: ${condition.currentBalance ?? "not detected"}.`
        default:
            return ""
    }
}

export function formatAccessTierDate(value: string) {
    return new Intl.DateTimeFormat("en", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(new Date(value))
}

function formatPlanPrice(chainId: number, tokenAddress: string, price: string) {
    const token = resolveTokenAssetMetadata({ chainId, tokenAddress })

    try {
        return `${formatTokenUnits(price, token.decimals) ?? price} ${token.symbol}`
    } catch {
        return `${price} ${token.symbol}`
    }
}
