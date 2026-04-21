import type {
    AccessPolicy,
    NftOwnershipPolicyNode,
    PolicyMode,
    TokenBalancePolicyNode,
} from "@contracts/types/access"
import type {
    AccessPolicyInput,
    AccessPolicyInputAndNode,
    AccessPolicyInputNftOwnershipNode,
    AccessPolicyInputNode,
    AccessPolicyInputOrNode,
    AccessPolicyInputSubscriptionNode,
    AccessPolicyInputTokenBalanceNode,
} from "@contracts/types/content"
import { v4 as uuidv4 } from "uuid"

export type AccessRuleType = "subscription" | "token_balance" | "nft_ownership"
export type AccessComposer = "public" | "single" | "and" | "or"

export interface AccessRuleForm {
    id: string
    type: AccessRuleType
    planCode: string
    chainId: string
    contractAddress: string
    minAmount: string
    decimals: string
    standard: "erc721" | "erc1155"
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
        composer: "single",
        rules: [createDefaultRule()],
    }
}

export function createDefaultRule(): AccessRuleForm {
    return {
        id: uuidv4(),
        type: "subscription",
        planCode: "main",
        chainId: "11155111",
        contractAddress: "0x0000000000000000000000000000000000000000",
        minAmount: "100",
        decimals: "18",
        standard: "erc721",
        tokenId: "",
        minBalance: "1",
    }
}

export function buildContentPolicyInput({ policyMode, builder }: BuildContentPolicyInputOptions): {
    policyMode: PolicyMode
    policyInput?: AccessPolicyInput
} {
    if (policyMode !== "custom") {
        return { policyMode }
    }

    return {
        policyMode,
        policyInput: buildPolicyInputFromBuilder(builder),
    }
}

export function buildPolicyInputFromBuilder(builder: AccessPolicyBuilderState): AccessPolicyInput {
    if (builder.composer === "public") {
        return { root: { type: "public" } }
    }

    const rules = builder.rules.filter(Boolean)
    if (rules.length === 0) {
        throw new Error("At least one access rule is required")
    }

    const nodes = rules.map((rule) => buildNodeFromRule(rule))

    if (builder.composer === "single") {
        if (nodes.length !== 1) {
            throw new Error("Single mode supports exactly one rule")
        }

        return { root: nodes[0] }
    }

    if (nodes.length < 2) {
        throw new Error("AND/OR modes require at least two rules")
    }

    const compositeNode: AccessPolicyInputAndNode | AccessPolicyInputOrNode =
        builder.composer === "and"
            ? { type: "and", children: nodes }
            : { type: "or", children: nodes }

    return { root: compositeNode }
}

export function summarizePolicyInput(builder: AccessPolicyBuilderState) {
    const labels = builder.rules.map((rule) => summarizeRule(rule))
    if (labels.length === 0) {
        return "No rules"
    }

    if (builder.composer === "public") {
        return "Public"
    }

    if (builder.composer === "single") {
        return labels[0]
    }

    return labels.join(builder.composer === "and" ? " AND " : " OR ")
}

export function parsePolicyToBuilder(policy: AccessPolicy): AccessPolicyBuilderState {
    const root = policy.root

    if (root.type === "and" || root.type === "or") {
        return {
            composer: root.type,
            rules: root.children.map((child) => parseAnyNodeToRule(child)),
        }
    }

    if (root.type === "public") {
        return {
            composer: "public",
            rules: [createDefaultRule()],
        }
    }

    return {
        composer: "single",
        rules: [parseAnyNodeToRule(root)],
    }
}

function buildNodeFromRule(rule: AccessRuleForm): AccessPolicyInputNode {
    switch (rule.type) {
        case "subscription":
            return buildSubscriptionNode(rule)
        case "token_balance":
            return buildTokenNode(rule)
        case "nft_ownership":
            return buildNftNode(rule)
        default:
            throw new Error("Unsupported rule type")
    }
}

function buildSubscriptionNode(rule: AccessRuleForm): AccessPolicyInputSubscriptionNode {
    const planCode = rule.planCode.trim().toLowerCase() || "main"

    return {
        type: "subscription",
        planCode,
    }
}

function buildTokenNode(rule: AccessRuleForm): AccessPolicyInputTokenBalanceNode {
    return {
        type: "token_balance",
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
        type: "nft_ownership",
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
        case "subscription":
            return `Subscription(${rule.planCode || "main"})`
        case "token_balance":
            return `Token(${rule.minAmount || "0"})`
        case "nft_ownership":
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
        case "public":
            return createDefaultRule()
        case "subscription":
            return createSubscriptionRule()
        case "token_balance":
            return createTokenRule(node)
        case "nft_ownership":
            return createNftRule(node)
        default:
            return createDefaultRule()
    }
}

function parseAnyNodeToRule(node: AccessPolicy["root"]): AccessRuleForm {
    if (node.type === "and" || node.type === "or") {
        return createDefaultRule()
    }

    return parseNodeToRule(node)
}

function createSubscriptionRule(): AccessRuleForm {
    return {
        ...createDefaultRule(),
        type: "subscription",
        planCode: "main",
    }
}

function createTokenRule(node: TokenBalancePolicyNode): AccessRuleForm {
    return {
        ...createDefaultRule(),
        type: "token_balance",
        chainId: String(node.chainId),
        contractAddress: node.contractAddress,
        minAmount: node.minAmount,
        decimals: String(node.decimals),
    }
}

function createNftRule(node: NftOwnershipPolicyNode): AccessRuleForm {
    return {
        ...createDefaultRule(),
        type: "nft_ownership",
        chainId: String(node.chainId),
        contractAddress: node.contractAddress,
        standard: node.standard,
        tokenId: node.tokenId ?? "",
        minBalance: node.minBalance ?? "1",
    }
}

function parseAddress(value: string) {
    const trimmed = value.trim().toLowerCase()
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
