import { subscriptionManagerAbi } from "@contracts/abi/SubscriptionManager"
import type { SubscriptionPlanDto } from "@contracts/types/content"
import { useState } from "react"
import { useAccount, usePublicClient, useWriteContract } from "wagmi"

import { Button } from "@/components/ui/button"
import {
    useConfirmSubscriptionPaymentMutation,
    useCreateSubscriptionPaymentIntentMutation,
} from "@/queries/subscription-plans"
import { useAuthStore } from "@/stores/auth-store"
import { erc20Abi } from "@/utils/web3/erc20"
import { toAddress } from "@/utils/web3/subscriptions"

interface SubscribeButtonProps {
    authorSlug: string
    plan: SubscriptionPlanDto
}

export function SubscribeButton({ authorSlug, plan }: SubscribeButtonProps) {
    const { address } = useAccount()
    const publicClient = usePublicClient({ chainId: plan.chainId })
    const token = useAuthStore((state) => state.token)
    const { writeContractAsync } = useWriteContract()
    const createIntentMutation = useCreateSubscriptionPaymentIntentMutation(authorSlug)
    const confirmPaymentMutation = useConfirmSubscriptionPaymentMutation()
    const [status, setStatus] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const disabled = !token || !address || !publicClient || !plan.active || !plan.planKey

    async function subscribe() {
        if (!address || !publicClient) {
            return
        }

        setError(null)
        setStatus("Creating payment intent...")

        try {
            const intent = await createIntentMutation.mutateAsync({ planCode: plan.code })
            const managerAddress = toAddress(plan.contractAddress)
            const tokenAddress = toAddress(plan.tokenAddress)
            const price = BigInt(plan.price)

            setStatus("Checking token allowance...")
            const allowance = await publicClient.readContract({
                address: tokenAddress,
                abi: erc20Abi,
                functionName: "allowance",
                args: [address, managerAddress],
            })

            if (allowance < price) {
                setStatus("Waiting for token approve...")
                const approveHash = await writeContractAsync({
                    address: tokenAddress,
                    abi: erc20Abi,
                    functionName: "approve",
                    chainId: plan.chainId,
                    args: [managerAddress, price],
                })
                await publicClient.waitForTransactionReceipt({ hash: approveHash })
            }

            setStatus("Paying subscription...")
            const paymentHash = await writeContractAsync({
                address: managerAddress,
                abi: subscriptionManagerAbi,
                functionName: "subscribe",
                chainId: plan.chainId,
                args: [plan.planKey as `0x${string}`],
            })

            setStatus("Confirming subscription...")
            await publicClient.waitForTransactionReceipt({ hash: paymentHash })
            await confirmPaymentMutation.mutateAsync({
                intentId: intent.id,
                input: { txHash: paymentHash },
            })
            setStatus("Subscription active")
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : "Failed to subscribe")
            setStatus(null)
        }
    }

    return (
        <div className="grid gap-2">
            <Button
                className="w-fit rounded-full"
                disabled={
                    disabled || createIntentMutation.isPending || confirmPaymentMutation.isPending
                }
                onClick={() => void subscribe()}
                type="button"
            >
                {!token ? "Sign in to subscribe" : "Subscribe"}
            </Button>
            {status ? <p className="text-sm text-[var(--muted)]">{status}</p> : null}
            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        </div>
    )
}
