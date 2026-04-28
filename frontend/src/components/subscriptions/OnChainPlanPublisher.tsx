import { subscriptionManagerAbi } from "@shared/abi/subscription-manager.abi"
import { PAYMENT_ASSET_CODE, type PaymentAsset } from "@shared/consts"
import type { UpsertSubscriptionPlanInput } from "@shared/types/content"
import { isSameAddressLike, isZeroAddress, normalizeAddressLike } from "@shared/utils"
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
    paymentAsset: PaymentAsset
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
    const paymentAssetCode = PAYMENT_ASSET_CODE[paymentAsset]
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
            const onChainPlan = await readPlan(contractAddress, currentPlanKey)
            const onChainAuthor = normalizeAddressLike(String(onChainPlan[0]))
            const planExists = !isZeroAddress(onChainAuthor)
            if (planExists && !isSameAddressLike(onChainAuthor, address)) {
                throw new Error("This on-chain plan key is already owned by another wallet.")
            }
            const shouldUpdate = Boolean(existingPlanKey || planExists)

            const txHash = await writeContractAsync({
                address: toAddress(contractAddress),
                abi: subscriptionManagerAbi,
                functionName: shouldUpdate ? "updatePlan" : "registerPlan",
                chainId,
                args: buildPublishArgs(currentPlanKey, shouldUpdate),
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

        return publicClient.readContract({
            address: toAddress(contract),
            abi: subscriptionManagerAbi,
            functionName: "plans",
            args: [key],
        })
    }

    function buildPublishArgs(currentPlanKey: `0x${string}`, shouldUpdate: boolean) {
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
