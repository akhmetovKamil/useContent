import { keccak256, toBytes, type Address, type Hex } from "viem"

export function buildPlanKey(input: { authorId: string; chainId: number; code: string }): Hex {
    return keccak256(toBytes(`usecontent:${input.chainId}:${input.authorId}:${input.code}`))
}

export function buildPlanExternalId(code: string): Hex {
    return keccak256(toBytes(code))
}

export function billingDaysToSeconds(days: number): bigint {
    return BigInt(days) * 24n * 60n * 60n
}

export function toAddress(value: string): Address {
    return value as Address
}
