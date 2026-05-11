import { useAccount, useSwitchChain } from "wagmi"

import { supportedChainOptions } from "@/utils/config/chains"

export function useEnsureWalletChain() {
    const { chainId: walletChainId } = useAccount()
    const { switchChainAsync } = useSwitchChain()

    return async function ensureWalletChain(targetChainId: number) {
        if (walletChainId === targetChainId) {
            return
        }
        if (!switchChainAsync) {
            throw new Error("Switch wallet network before sending the transaction.")
        }

        await switchChainAsync({ chainId: targetChainId })
    }
}

export function getWalletChainName(chainId: number) {
    return supportedChainOptions.find((chain) => chain.id === chainId)?.name ?? `chain ${chainId}`
}
