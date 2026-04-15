import type { AccessPolicy, PolicyMode } from "@contracts/types/access"

interface BuildPolicyInputOptions {
    policyMode: PolicyMode
    customPolicyText: string
}

export function buildPolicyInput({ policyMode, customPolicyText }: BuildPolicyInputOptions): {
    policyMode: PolicyMode
    policy?: AccessPolicy
} {
    if (policyMode !== "custom") {
        return { policyMode }
    }

    const trimmed = customPolicyText.trim()
    if (!trimmed) {
        throw new Error("Custom policy JSON is required")
    }

    return {
        policyMode,
        policy: JSON.parse(trimmed) as AccessPolicy,
    }
}
