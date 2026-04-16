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

        setError(null)
        setStatus(existingPlanKey ? "Updating plan on-chain..." : "Publishing plan on-chain...")

        try {
            const txHash = await writeContractAsync({
                address: toAddress(contractAddress),
                abi: subscriptionManagerAbi,
                functionName: existingPlanKey ? "updatePlan" : "registerPlan",
                chainId,
                args: existingPlanKey
                    ? [
                          planKey,
                          paymentAssetCode,
                          toAddress(tokenAddress),
                          BigInt(price),
                          billingDaysToSeconds(billingPeriodDays),
                          active,
                          buildPlanExternalId(code),
                      ]
                    : [
                          planKey,
                          paymentAssetCode,
                          toAddress(tokenAddress),
                          BigInt(price),
                          billingDaysToSeconds(billingPeriodDays),
                          buildPlanExternalId(code),
                      ],
            })

            setStatus("Waiting for transaction confirmation...")
            await publicClient.waitForTransactionReceipt({ hash: txHash })
            onPublished({ planKey, registrationTxHash: txHash })
            setStatus("Transaction confirmed. Saving plan in backend...")
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : "Failed to publish on-chain plan")
            setStatus(null)
        }
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
