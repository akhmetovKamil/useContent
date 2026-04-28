import {
    ACCESS_COMPOSER,
    ACCESS_POLICY_NODE_TYPE,
    NFT_STANDARD,
    POLICY_MODE,
    ZERO_ADDRESS,
    type AccessComposer,
    type AccessPolicyNodeType,
    type NftStandard,
} from "@shared/consts"
import type {
    AccessPolicy,
    NftOwnershipPolicyNode,
    PolicyMode,
    TokenBalancePolicyNode,
} from "@shared/types/access"
import type {
    AccessPolicyInput,
    AccessPolicyInputAndNode,
    AccessPolicyInputNftOwnershipNode,
    AccessPolicyInputNode,
    AccessPolicyInputOrNode,
    AccessPolicyInputSubscriptionNode,
    AccessPolicyInputTokenBalanceNode,
} from "@shared/types/content"
import { normalizeAddressLike } from "@shared/utils"
import { v4 as uuidv4 } from "uuid"

export type { AccessComposer } from "@shared/consts"

export type AccessRuleType = Extract<
    AccessPolicyNodeType,
    "subscription" | "token_balance" | "nft_ownership"
>

export interface AccessRuleForm {
    id: string
    type: AccessRuleType
    planCode: string
    chainId: string
    contractAddress: string
    minAmount: string
    decimals: string
    standard: NftStandard
    tokenId: string
    minBalance: string
}

export interface AccessPolicyBuilderState {
    composer: AccessComposer
    rules: AccessRuleForm[]
}

interface BuildContentPolicyInputOptions {
    policyMode: PolicyMode
    builder: AccessPolicyBuilderState
}

export function createDefaultPolicyBuilderState(): AccessPolicyBuilderState {
    return {
        composer: ACCESS_COMPOSER.SINGLE,
        rules: [createDefaultRule()],
    }
}

export function createDefaultRule(): AccessRuleForm {
    return {
        id: uuidv4(),
        type: ACCESS_POLICY_NODE_TYPE.SUBSCRIPTION,
        planCode: "main",
        chainId: "11155111",
        contractAddress: ZERO_ADDRESS,
        minAmount: "100",
        decimals: "18",
        standard: NFT_STANDARD.ERC721,
        tokenId: "",
        minBalance: "1",
    }
}

export function buildContentPolicyInput({ policyMode, builder }: BuildContentPolicyInputOptions): {
    policyMode: PolicyMode
    policyInput?: AccessPolicyInput
} {
    if (policyMode !== POLICY_MODE.CUSTOM) {
        return { policyMode }
    }

    return {
        policyMode,
        policyInput: buildPolicyInputFromBuilder(builder),
    }
}

export function buildPolicyInputFromBuilder(builder: AccessPolicyBuilderState): AccessPolicyInput {
    if (builder.composer === ACCESS_COMPOSER.PUBLIC) {
        return { root: { type: ACCESS_POLICY_NODE_TYPE.PUBLIC } }
    }

    const rules = builder.rules.filter(Boolean)
    if (rules.length === 0) {
        throw new Error("At least one access rule is required")
    }

    const nodes = rules.map((rule) => buildNodeFromRule(rule))

    if (builder.composer === ACCESS_COMPOSER.SINGLE) {
        if (nodes.length !== 1) {
            throw new Error("Single mode supports exactly one rule")
        }

        return { root: nodes[0] }
    }

    if (nodes.length < 2) {
        throw new Error("AND/OR modes require at least two rules")
    }

    const compositeNode: AccessPolicyInputAndNode | AccessPolicyInputOrNode =
        builder.composer === ACCESS_COMPOSER.AND
            ? { type: ACCESS_POLICY_NODE_TYPE.AND, children: nodes }
            : { type: ACCESS_POLICY_NODE_TYPE.OR, children: nodes }

    return { root: compositeNode }
}

export function summarizePolicyInput(builder: AccessPolicyBuilderState) {
    const labels = builder.rules.map((rule) => summarizeRule(rule))
    if (labels.length === 0) {
        return "No rules"
    }

    if (builder.composer === ACCESS_COMPOSER.PUBLIC) {
        return "Public"
    }

    if (builder.composer === ACCESS_COMPOSER.SINGLE) {
        return labels[0]
    }

    return labels.join(builder.composer === ACCESS_COMPOSER.AND ? " AND " : " OR ")
}

export function parsePolicyToBuilder(policy: AccessPolicy): AccessPolicyBuilderState {
    const root = policy.root

    if (root.type === ACCESS_POLICY_NODE_TYPE.AND || root.type === ACCESS_POLICY_NODE_TYPE.OR) {
        return {
            composer: root.type,
            rules: root.children.map((child) => parseAnyNodeToRule(child)),
        }
    }

    if (root.type === ACCESS_POLICY_NODE_TYPE.PUBLIC) {
        return {
            composer: ACCESS_COMPOSER.PUBLIC,
            rules: [createDefaultRule()],
        }
    }

    return {
        composer: ACCESS_COMPOSER.SINGLE,
        rules: [parseAnyNodeToRule(root)],
    }
}

function buildNodeFromRule(rule: AccessRuleForm): AccessPolicyInputNode {
    switch (rule.type) {
        case ACCESS_POLICY_NODE_TYPE.SUBSCRIPTION:
            return buildSubscriptionNode(rule)
        case ACCESS_POLICY_NODE_TYPE.TOKEN_BALANCE:
            return buildTokenNode(rule)
        case ACCESS_POLICY_NODE_TYPE.NFT_OWNERSHIP:
            return buildNftNode(rule)
        default:
            throw new Error("Unsupported rule type")
    }
}

function buildSubscriptionNode(rule: AccessRuleForm): AccessPolicyInputSubscriptionNode {
    const planCode = rule.planCode.trim().toLowerCase() || "main"

    return {
        type: ACCESS_POLICY_NODE_TYPE.SUBSCRIPTION,
        planCode,
    }
}

function buildTokenNode(rule: AccessRuleForm): AccessPolicyInputTokenBalanceNode {
    return {
        type: ACCESS_POLICY_NODE_TYPE.TOKEN_BALANCE,
        chainId: parsePositiveInteger(rule.chainId, "Chain ID"),
        contractAddress: parseAddress(rule.contractAddress),
        minAmount: parsePositiveIntegerString(rule.minAmount, "Minimum amount"),
        decimals: parseIntegerInRange(rule.decimals, "Decimals", 0, 255),
    }
}

function buildNftNode(rule: AccessRuleForm): AccessPolicyInputNftOwnershipNode {
    const tokenId = rule.tokenId.trim()
    const minBalance = rule.minBalance.trim()

    return {
        type: ACCESS_POLICY_NODE_TYPE.NFT_OWNERSHIP,
        chainId: parsePositiveInteger(rule.chainId, "Chain ID"),
        contractAddress: parseAddress(rule.contractAddress),
        standard: rule.standard,
        tokenId: tokenId || undefined,
        minBalance: minBalance
            ? parsePositiveIntegerString(minBalance, "Minimum balance")
            : undefined,
    }
}

function summarizeRule(rule: AccessRuleForm) {
    switch (rule.type) {
        case ACCESS_POLICY_NODE_TYPE.SUBSCRIPTION:
            return `Subscription(${rule.planCode || "main"})`
        case ACCESS_POLICY_NODE_TYPE.TOKEN_BALANCE:
            return `Token(${rule.minAmount || "0"})`
        case ACCESS_POLICY_NODE_TYPE.NFT_OWNERSHIP:
            return `NFT(${rule.standard}${rule.tokenId ? ` #${rule.tokenId}` : ""})`
        default:
            return "Rule"
    }
}

function parseNodeToRule(
    node: Extract<
        AccessPolicy["root"],
        { type: "public" | "subscription" | "token_balance" | "nft_ownership" }
    >
): AccessRuleForm {
    switch (node.type) {
        case ACCESS_POLICY_NODE_TYPE.PUBLIC:
            return createDefaultRule()
        case ACCESS_POLICY_NODE_TYPE.SUBSCRIPTION:
            return createSubscriptionRule()
        case ACCESS_POLICY_NODE_TYPE.TOKEN_BALANCE:
            return createTokenRule(node)
        case ACCESS_POLICY_NODE_TYPE.NFT_OWNERSHIP:
            return createNftRule(node)
        default:
            return createDefaultRule()
    }
}

function parseAnyNodeToRule(node: AccessPolicy["root"]): AccessRuleForm {
    if (node.type === ACCESS_POLICY_NODE_TYPE.AND || node.type === ACCESS_POLICY_NODE_TYPE.OR) {
        return createDefaultRule()
    }

    return parseNodeToRule(node)
}

function createSubscriptionRule(): AccessRuleForm {
    return {
        ...createDefaultRule(),
        type: ACCESS_POLICY_NODE_TYPE.SUBSCRIPTION,
        planCode: "main",
    }
}

function createTokenRule(node: TokenBalancePolicyNode): AccessRuleForm {
    return {
        ...createDefaultRule(),
        type: ACCESS_POLICY_NODE_TYPE.TOKEN_BALANCE,
        chainId: String(node.chainId),
        contractAddress: node.contractAddress,
        minAmount: node.minAmount,
        decimals: String(node.decimals),
    }
}

function createNftRule(node: NftOwnershipPolicyNode): AccessRuleForm {
    return {
        ...createDefaultRule(),
        type: ACCESS_POLICY_NODE_TYPE.NFT_OWNERSHIP,
        chainId: String(node.chainId),
        contractAddress: node.contractAddress,
        standard: node.standard,
        tokenId: node.tokenId ?? "",
        minBalance: node.minBalance ?? "1",
    }
}

function parseAddress(value: string) {
    const trimmed = normalizeAddressLike(value)
    if (!/^0x[a-f0-9]{40}$/.test(trimmed)) {
        throw new Error("Contract address must be a 42-char hex address")
    }
    return trimmed
}

function parsePositiveInteger(value: string, label: string) {
    const parsed = Number(value.trim())
    if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new Error(`${label} must be a positive integer`)
    }
    return parsed
}

function parseIntegerInRange(value: string, label: string, min: number, max: number) {
    const parsed = Number(value.trim())
    if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
        throw new Error(`${label} must be between ${min} and ${max}`)
    }
    return parsed
}

function parsePositiveIntegerString(value: string, label: string) {
    const trimmed = value.trim()
    if (!/^[0-9]+$/.test(trimmed) || BigInt(trimmed) <= 0n) {
        throw new Error(`${label} must be a positive integer string`)
    }
    return trimmed
}
