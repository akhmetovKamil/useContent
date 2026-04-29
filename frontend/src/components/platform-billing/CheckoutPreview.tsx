import { platformSubscriptionManagerAbi } from "@shared/abi/platform-subscription-manager.abi"
import { PAYMENT_ASSET } from "@shared/consts"
import type { PlatformPlanDto } from "@shared/types/platform"
import { isSameAddressLike, shortenWalletAddress } from "@shared/utils/web3"
import { CreditCard } from "lucide-react"
import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useAccount, usePublicClient, useWriteContract } from "wagmi"

import { SummaryRow } from "@/components/platform-billing/SummaryRow"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Eyebrow } from "@/components/ui/page"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    useConfirmPlatformSubscriptionPaymentMutation,
    useCreatePlatformSubscriptionPaymentIntentMutation,
    usePlatformSubscriptionManagerDeploymentQuery,
} from "@/queries/platform"
import { queryKeys } from "@/queries/queryKeys"
import { supportedChainOptions } from "@/utils/config/chains"
import { getTokenPresets } from "@/utils/config/tokens"
import { formatFileSize, formatUsd } from "@/utils/format"
import { GIB } from "@/utils/platform-billing"
import { erc20Abi } from "@/utils/web3/erc20"
import { toAddress } from "@/utils/web3/subscriptions"

export function CheckoutPreview({
    chainId,
    extraGb,
    monthlyEstimateCents,
    onChainIdChange,
    onSuccess,
    onTokenAddressChange,
    plan,
    tokenAddress,
}: {
    chainId: number
    extraGb: number
    monthlyEstimateCents: number
    onChainIdChange: (chainId: number) => void
    onSuccess: () => void
    onTokenAddressChange: (address: `0x${string}`) => void
    plan: PlatformPlanDto
    tokenAddress: `0x${string}`
}) {
    const { address } = useAccount()
    const queryClient = useQueryClient()
    const publicClient = usePublicClient({ chainId })
    const { writeContractAsync } = useWriteContract()
    const createIntentMutation = useCreatePlatformSubscriptionPaymentIntentMutation()
    const confirmPaymentMutation = useConfirmPlatformSubscriptionPaymentMutation()
    const deploymentQuery = usePlatformSubscriptionManagerDeploymentQuery(chainId)
    const [status, setStatus] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const tokenOptions = getTokenPresets(chainId).filter(
        (
            preset
        ): preset is ReturnType<typeof getTokenPresets>[number] & { address: `0x${string}` } =>
            preset.kind === PAYMENT_ASSET.ERC20 && Boolean(preset.address)
    )
    const selectedToken = tokenOptions.find((token) =>
        isSameAddressLike(token.address, tokenAddress)
    )
    const disabled =
        !address ||
        !publicClient ||
        !deploymentQuery.data ||
        createIntentMutation.isPending ||
        confirmPaymentMutation.isPending

    async function pay() {
        if (!address || !publicClient) {
            return
        }

        setError(null)
        setStatus("Creating platform payment intent...")

        try {
            const intent = await createIntentMutation.mutateAsync({
                planCode: plan.code,
                extraStorageGb: extraGb,
                chainId,
                tokenAddress,
            })
            const managerAddress = toAddress(intent.contractAddress)
            const token = toAddress(intent.tokenAddress)
            const amount = BigInt(intent.amount)

            setStatus("Checking token allowance...")
            const allowance = await publicClient.readContract({
                address: token,
                abi: erc20Abi,
                functionName: "allowance",
                args: [address, managerAddress],
            })

            if (allowance < amount) {
                setStatus("Waiting for token approve...")
                const approveHash = await writeContractAsync({
                    address: token,
                    abi: erc20Abi,
                    functionName: "approve",
                    chainId,
                    args: [managerAddress, amount],
                })
                await publicClient.waitForTransactionReceipt({ hash: approveHash })
            }

            setStatus("Paying platform subscription...")
            const paymentHash = await writeContractAsync({
                address: managerAddress,
                abi: platformSubscriptionManagerAbi,
                functionName: "subscribe",
                chainId,
                args: [intent.tierKey as `0x${string}`, intent.extraStorageGb],
            })

            setStatus("Confirming billing state...")
            await publicClient.waitForTransactionReceipt({ hash: paymentHash })
            await confirmPaymentMutation.mutateAsync({
                intentId: intent.id,
                input: { txHash: paymentHash },
            })
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: queryKeys.myAuthorPlatformBilling }),
                queryClient.invalidateQueries({ queryKey: queryKeys.myProjects() }),
            ])
            setStatus("Platform subscription active")
            onSuccess()
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : "Failed to activate billing")
            setStatus(null)
        }
    }

    return (
        <div className="grid gap-6">
            <DrawerHeader>
                <Eyebrow>platform checkout</Eyebrow>
                <DrawerTitle>{plan.title} creator plan</DrawerTitle>
                <DrawerDescription>
                    Pay the platform subscription from your connected wallet. This unlocks project
                    creation and updates your storage quota after backend confirmation.
                </DrawerDescription>
            </DrawerHeader>
            <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm">
                    Network
                    <Select
                        onValueChange={(value) => onChainIdChange(Number(value))}
                        value={String(chainId)}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {supportedChainOptions.map((chain) => (
                                <SelectItem key={chain.id} value={String(chain.id)}>
                                    {chain.shortName} · {chain.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </label>
                <label className="grid gap-2 text-sm">
                    Payment token
                    <Select
                        onValueChange={(value) => onTokenAddressChange(value as `0x${string}`)}
                        value={tokenAddress}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {tokenOptions.map((token) => (
                                <SelectItem key={token.address} value={token.address}>
                                    {token.symbol} · {token.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </label>
            </div>
            {deploymentQuery.data ? (
                <Card className="rounded-[24px] bg-[var(--accent-soft)]">
                    <CardContent className="grid gap-2 p-4 text-sm">
                        <SummaryRow
                            label="Manager"
                            value={shortenWalletAddress(deploymentQuery.data.address)}
                        />
                        <SummaryRow
                            label="Token"
                            value={selectedToken?.symbol ?? shortenWalletAddress(tokenAddress)}
                        />
                    </CardContent>
                </Card>
            ) : (
                <Card className="rounded-[24px] border-amber-200 bg-amber-50 text-slate-950">
                    <CardContent className="p-4 text-sm leading-6">
                        Deploy `PlatformSubscriptionManager` for this network first. The address is
                        loaded from backend registry.
                    </CardContent>
                </Card>
            )}
            <Card className="rounded-[28px]">
                <CardContent className="grid gap-4 p-5">
                    <SummaryRow label="Base plan" value={formatUsd(plan.priceUsdCents)} />
                    <SummaryRow
                        label="Extra storage"
                        value={`${extraGb} GB · ${formatUsd(
                            extraGb * plan.pricePerExtraGbUsdCents
                        )}`}
                    />
                    <SummaryRow label="Total estimate" value={formatUsd(monthlyEstimateCents)} />
                    <SummaryRow
                        label="Quota after upgrade"
                        value={formatFileSize(plan.baseStorageBytes + extraGb * GIB)}
                    />
                </CardContent>
            </Card>
            <Button
                className="rounded-full"
                disabled={disabled}
                onClick={() => void pay()}
                type="button"
            >
                <CreditCard className="size-4" />
                {!address ? "Connect wallet to pay" : "Pay and activate"}
            </Button>
            {status ? <p className="text-sm text-[var(--muted)]">{status}</p> : null}
            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        </div>
    )
}
