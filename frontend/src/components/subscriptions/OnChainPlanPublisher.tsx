import { subscriptionManagerAbi } from "@contracts/abi/SubscriptionManager"
import type { UpsertSubscriptionPlanInput } from "@contracts/types/content"
import { useState } from "react"
import { useAccount, usePublicClient, useWriteContract } from "wagmi"

import { Button } from "@/components/ui/button"
import { useMyAuthorProfileQuery } from "@/queries/profile"
import {
    billingDaysToSeconds,
    buildPlanExternalId,
    buildPlanKey,
    toAddress,
} from "@/utils/web3/subscriptions"

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"
const legacySubscriptionManagerAbi = [
    {
        type: "function",
        name: "plans",
        stateMutability: "view",
        inputs: [{ name: "planKey", type: "bytes32" }],
        outputs: [
            { name: "author", type: "address" },
            { name: "token", type: "address" },
            { name: "price", type: "uint256" },
            { name: "periodSeconds", type: "uint64" },
            { name: "active", type: "bool" },
            { name: "externalId", type: "bytes32" },
        ],
    },
    {
        type: "function",
        name: "registerPlan",
        stateMutability: "nonpayable",
        inputs: [
            { name: "planKey", type: "bytes32" },
            { name: "token", type: "address" },
            { name: "price", type: "uint256" },
            { name: "periodSeconds", type: "uint64" },
            { name: "externalId", type: "bytes32" },
        ],
        outputs: [],
    },
    {
        type: "function",
        name: "updatePlan",
        stateMutability: "nonpayable",
        inputs: [
            { name: "planKey", type: "bytes32" },
            { name: "token", type: "address" },
            { name: "price", type: "uint256" },
            { name: "periodSeconds", type: "uint64" },
            { name: "active", type: "bool" },
            { name: "externalId", type: "bytes32" },
        ],
        outputs: [],
    },
] as const

interface OnChainPlanPublisherProps {
    active: boolean
    billingPeriodDays: number
    chainId: number
    code: string
    contractAddress: string
    disabled?: boolean
    existingPlanKey?: string
    onPublished: (
        input: Pick<UpsertSubscriptionPlanInput, "planKey" | "registrationTxHash">
    ) => void
    paymentAsset: "erc20" | "native"
    price: string
    tokenAddress: string
}

export function OnChainPlanPublisher({
    active,
    billingPeriodDays,
    chainId,
    code,
    contractAddress,
    disabled,
    existingPlanKey,
    onPublished,
    paymentAsset,
    price,
    tokenAddress,
}: OnChainPlanPublisherProps) {
    const { address } = useAccount()
    const publicClient = usePublicClient({ chainId })
    const { writeContractAsync } = useWriteContract()
    const authorQuery = useMyAuthorProfileQuery(Boolean(address))
    const [status, setStatus] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const authorId = authorQuery.data?.id
    const planKey = authorId ? buildPlanKey({ authorId, chainId, code }) : null
    const paymentAssetCode = paymentAsset === "native" ? 1 : 0
    const canPublish = Boolean(
        address && publicClient && authorId && contractAddress && tokenAddress
    )

    async function publish() {
        if (!publicClient || !planKey) {
            return
        }

        const currentPlanKey = planKey
        setError(null)
        setStatus(existingPlanKey ? "Updating plan on-chain..." : "Publishing plan on-chain...")

        try {
            const { isLegacy, plan: onChainPlan } = await readPlan(contractAddress, currentPlanKey)
            const onChainAuthor = String(onChainPlan[0]).toLowerCase()
            const planExists = onChainAuthor !== ZERO_ADDRESS
            if (planExists && onChainAuthor !== address?.toLowerCase()) {
                throw new Error("This on-chain plan key is already owned by another wallet.")
            }
            if (isLegacy && paymentAsset === "native") {
                throw new Error(
                    "This manager was deployed before native token support. Deploy the current SubscriptionManager for this network first."
                )
            }
            const shouldUpdate = Boolean(existingPlanKey || planExists)

            const txHash = isLegacy
                ? await writeContractAsync({
                      address: toAddress(contractAddress),
                      abi: legacySubscriptionManagerAbi,
                      functionName: shouldUpdate ? "updatePlan" : "registerPlan",
                      chainId,
                      args: buildLegacyPublishArgs(currentPlanKey, shouldUpdate),
                  })
                : await writeContractAsync({
                      address: toAddress(contractAddress),
                      abi: subscriptionManagerAbi,
                      functionName: shouldUpdate ? "updatePlan" : "registerPlan",
                      chainId,
                      args: buildCurrentPublishArgs(currentPlanKey, shouldUpdate),
                  })

            setStatus("Waiting for transaction confirmation...")
            await publicClient.waitForTransactionReceipt({ hash: txHash })
            onPublished({ planKey: currentPlanKey, registrationTxHash: txHash })
            setStatus("Transaction confirmed. Saving plan in backend...")
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : "Failed to publish on-chain plan")
            setStatus(null)
        }
    }

    async function readPlan(contract: string, key: `0x${string}`) {
        if (!publicClient) {
            throw new Error("Wallet network client is not ready.")
        }

        try {
            const plan = await publicClient.readContract({
                address: toAddress(contract),
                abi: subscriptionManagerAbi,
                functionName: "plans",
                args: [key],
            })
            return { isLegacy: false, plan }
        } catch (caught) {
            const message = caught instanceof Error ? caught.message : ""
            if (!message.includes("out of bounds") && !message.includes("Position")) {
                throw caught
            }

            const plan = await publicClient.readContract({
                address: toAddress(contract),
                abi: legacySubscriptionManagerAbi,
                functionName: "plans",
                args: [key],
            })
            return { isLegacy: true, plan }
        }
    }

    function buildLegacyPublishArgs(currentPlanKey: `0x${string}`, shouldUpdate: boolean) {
        const token = toAddress(tokenAddress)
        const amount = BigInt(price)
        const period = billingDaysToSeconds(billingPeriodDays)
        const externalId = buildPlanExternalId(code)

        return shouldUpdate
            ? ([currentPlanKey, token, amount, period, active, externalId] as const)
            : ([currentPlanKey, token, amount, period, externalId] as const)
    }

    function buildCurrentPublishArgs(currentPlanKey: `0x${string}`, shouldUpdate: boolean) {
        const token = toAddress(tokenAddress)
        const amount = BigInt(price)
        const period = billingDaysToSeconds(billingPeriodDays)
        const externalId = buildPlanExternalId(code)

        return shouldUpdate
            ? ([
                  currentPlanKey,
                  paymentAssetCode,
                  token,
                  amount,
                  period,
                  active,
                  externalId,
              ] as const)
            : ([currentPlanKey, paymentAssetCode, token, amount, period, externalId] as const)
    }

    return (
        <div className="grid gap-2">
            <Button
                className="w-fit rounded-full"
                disabled={disabled || !canPublish}
                onClick={() => void publish()}
                type="button"
                variant="outline"
            >
                {existingPlanKey ? "Update plan" : "Publish plan"}
            </Button>
            <p className="text-xs text-[var(--muted)]">
                Plan key:{" "}
                <span className="font-mono">
                    {planKey ?? "connect wallet and load author profile"}
                </span>
            </p>
            {status ? <p className="text-sm text-[var(--muted)]">{status}</p> : null}
            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        </div>
    )
}
