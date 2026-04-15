export const ACCESS_POLICY_VERSION = 1

export type PolicyMode = "public" | "inherited" | "custom"

export interface PublicPolicyNode {
    type: "public"
}

export interface SubscriptionPolicyNode {
    type: "subscription"
    authorId: string
    planId: string
}

export interface TokenBalancePolicyNode {
    type: "token_balance"
    chainId: number
    contractAddress: string
    minAmount: string
    decimals: number
}

export interface NftOwnershipPolicyNode {
    type: "nft_ownership"
    chainId: number
    contractAddress: string
    standard: "erc721" | "erc1155"
    tokenId?: string
    minBalance?: string
}

export interface OrPolicyNode {
    type: "or"
    children: AccessPolicyNode[]
}

export type AccessPolicyNode =
    | PublicPolicyNode
    | SubscriptionPolicyNode
    | TokenBalancePolicyNode
    | NftOwnershipPolicyNode
    | OrPolicyNode

export interface AccessPolicy {
    version: typeof ACCESS_POLICY_VERSION
    root: AccessPolicyNode
}
