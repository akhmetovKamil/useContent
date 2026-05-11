import { platformStorageManagerAbi } from "@shared/abi/platform-storage-manager.abi"
import { platformTierManagerAbi } from "@shared/abi/platform-tier-manager.abi"
import type { PlatformPlanDto } from "@shared/types/platform"
import { getPlatformUsdcToken } from "@shared/utils/platform-usdc"
import { shortenWalletAddress } from "@shared/utils/web3"
import { CreditCard } from "lucide-react"
import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useAccount, usePublicClient, useWriteContract } from "wagmi"

import { SummaryRow } from "@/components/platform-billing/SummaryRow"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Eyebrow } from "@/components/ui/page"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    useConfirmPlatformStoragePaymentMutation,
    useConfirmPlatformTierPaymentMutation,
    useCreatePlatformStoragePaymentIntentMutation,
    useCreatePlatformTierPaymentIntentMutation,
    usePlatformStorageManagerDeploymentQuery,
    usePlatformTierManagerDeploymentQuery,
} from "@/queries/platform"
import { queryKeys } from "@/queries/queryKeys"
import { getWalletChainName, useEnsureWalletChain } from "@/hooks/useEnsureWalletChain"
import { supportedChainOptions } from "@/utils/config/chains"
import { formatFileSize, formatUsdCents } from "@/utils/format"
import { GIB } from "@/utils/platform-billing"
import { erc20Abi } from "@/utils/web3/erc20"
import { toAddress } from "@/utils/web3/subscriptions"

export function CheckoutPreview({
    chainId,
    extraGb,
    kind,
    monthlyEstimateCents,
    onChainIdChange,
    onSuccess,
    plan,
    tokenAddress,
    currentExtraGb = 0,
}: {
    chainId: number
    currentExtraGb?: number
    extraGb: number
    kind: "tier" | "storage"
    monthlyEstimateCents: number
    onChainIdChange: (chainId: number) => void
    onSuccess: () => void
    plan: PlatformPlanDto
    tokenAddress: `0x${string}`
}) {
    const { address } = useAccount()
    const queryClient = useQueryClient()
    const publicClient = usePublicClient({ chainId })
    const { writeContractAsync } = useWriteContract()
    const ensureWalletChain = useEnsureWalletChain()
    const createTierIntentMutation = useCreatePlatformTierPaymentIntentMutation()
    const confirmTierPaymentMutation = useConfirmPlatformTierPaymentMutation()
    const createStorageIntentMutation = useCreatePlatformStoragePaymentIntentMutation()
    const confirmStoragePaymentMutation = useConfirmPlatformStoragePaymentMutation()
    const tierDeploymentQuery = usePlatformTierManagerDeploymentQuery(chainId)
    const storageDeploymentQuery = usePlatformStorageManagerDeploymentQuery(chainId)
    const [status, setStatus] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const selectedToken = getPlatformUsdcToken(chainId)
    const deploymentQuery = kind === "tier" ? tierDeploymentQuery : storageDeploymentQuery
    const storageAlreadyCovered = kind === "storage" && extraGb <= currentExtraGb
    const isPending =
        createTierIntentMutation.isPending ||
        confirmTierPaymentMutation.isPending ||
        createStorageIntentMutation.isPending ||
        confirmStoragePaymentMutation.isPending
    const disabled =
        !address ||
        !publicClient ||
        !deploymentQuery.data ||
        !selectedToken ||
        storageAlreadyCovered ||
        isPending

    async function pay() {
        if (!address || !publicClient) {
            return
        }
        if (kind === "storage" && extraGb <= currentExtraGb) {
            setError("This storage amount is already active.")
            return
        }

        setError(null)
        setStatus(
            kind === "tier"
                ? "Creating platform tier payment intent..."
                : "Creating extra storage payment intent..."
        )

        try {
            setStatus(`Switching wallet to ${getWalletChainName(chainId)}...`)
            await ensureWalletChain(chainId)
            const intent =
                kind === "tier"
                    ? await createTierIntentMutation.mutateAsync({
                          planCode: plan.code,
                          chainId,
                      })
                    : await createStorageIntentMutation.mutateAsync({
                          extraStorageGb: extraGb,
                          chainId,
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

            setStatus(kind === "tier" ? "Paying creator plan..." : "Paying extra storage...")
            const paymentHash =
                kind === "tier" && "tierKey" in intent
                    ? await writeContractAsync({
                          address: managerAddress,
                          abi: platformTierManagerAbi,
                          functionName: "subscribe",
                          chainId,
                          args: [intent.tierKey as `0x${string}`],
                      })
                    : "extraStorageGb" in intent
                      ? await writeContractAsync({
                            address: managerAddress,
                            abi: platformStorageManagerAbi,
                            functionName: "subscribeStorage",
                            chainId,
                            args: [intent.extraStorageGb],
                        })
                      : null
            if (!paymentHash) {
                throw new Error("Invalid platform checkout intent")
            }

            setStatus("Confirming billing state...")
            await publicClient.waitForTransactionReceipt({ hash: paymentHash })
            if (kind === "tier") {
                await confirmTierPaymentMutation.mutateAsync({
                    intentId: intent.id,
                    input: { txHash: paymentHash },
                })
            } else {
                await confirmStoragePaymentMutation.mutateAsync({
                    intentId: intent.id,
                    input: { txHash: paymentHash },
                })
            }
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: queryKeys.myAuthorPlatformBilling }),
                queryClient.invalidateQueries({ queryKey: queryKeys.myProjects() }),
            ])
            setStatus(kind === "tier" ? "Creator plan active" : "Extra storage active")
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
                <DrawerTitle>
                    {kind === "tier" ? `${plan.title} creator plan` : "Extra storage"}
                </DrawerTitle>
                <DrawerDescription>
                    {kind === "tier"
                        ? "Pay the creator plan from your connected wallet. This unlocks feature gates and base storage after backend confirmation."
                        : "Pay extra storage from your connected wallet. This is independent from the creator plan and updates quota after backend confirmation."}
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
                <div className="grid gap-2 text-sm">
                    Payment token
                    <Card className="rounded-[20px] border-[var(--line)] bg-[var(--surface)]">
                        <CardContent className="grid gap-1 p-4">
                            <div className="font-medium text-[var(--foreground)]">USDC only</div>
                            <div className="text-xs text-[var(--muted)]">
                                {selectedToken
                                    ? `${selectedToken.name} · ${shortenWalletAddress(tokenAddress)}`
                                    : "USDC is not configured for this network"}
                            </div>
                        </CardContent>
                    </Card>
                </div>
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
                        {kind === "tier"
                            ? "PlatformTierManager is not registered for this network."
                            : "PlatformStorageManager is not registered for this network."}{" "}
                        The address is loaded from backend registry.
                    </CardContent>
                </Card>
            )}
            <Card className="rounded-[28px]">
                <CardContent className="grid gap-4 p-5">
                    {kind === "tier" ? (
                        <SummaryRow label="Creator plan" value={formatUsdCents(plan.priceUsdCents)} />
                    ) : (
                        <SummaryRow
                            label="Extra storage"
                            value={
                                storageAlreadyCovered
                                    ? `${extraGb} GB · already active`
                                    : `${extraGb} GB · ${formatUsdCents(
                                          extraGb * plan.pricePerExtraGbUsdCents
                                      )}`
                            }
                        />
                    )}
                    <SummaryRow label="Total estimate" value={formatUsdCents(monthlyEstimateCents)} />
                    <SummaryRow
                        label="Quota after upgrade"
                        value={formatFileSize(
                            kind === "tier"
                                ? plan.baseStorageBytes
                                : plan.baseStorageBytes + extraGb * GIB
                        )}
                    />
                    {kind === "storage" ? (
                        <SummaryRow
                            label="Currently paid extra"
                            value={`${currentExtraGb} GB · ${formatFileSize(currentExtraGb * GIB)}`}
                        />
                    ) : null}
                </CardContent>
            </Card>
            <Button
                className="rounded-full"
                disabled={disabled}
                onClick={() => void pay()}
                type="button"
            >
                <CreditCard className="size-4" />
                {!address
                    ? "Connect wallet to pay"
                    : storageAlreadyCovered
                        ? "Already active"
                        : "Pay and activate"}
            </Button>
            {status ? <p className="text-sm text-[var(--muted)]">{status}</p> : null}
            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        </div>
    )
}
