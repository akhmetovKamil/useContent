import { useMutation } from "@tanstack/react-query"
import { useAccount, useDisconnect, useSignMessage } from "wagmi"

import { authApi } from "@/api/AuthApi"
import { useAuthStore } from "@/shared/session/auth-store"

export function useWalletSession() {
    const { address, isConnected } = useAccount()
    const { signMessageAsync } = useSignMessage()
    const { disconnect } = useDisconnect()
    const setSession = useAuthStore((state) => state.setSession)
    const clearSession = useAuthStore((state) => state.clearSession)

    const signInMutation = useMutation({
        mutationFn: async () => {
            if (!address) {
                throw new Error("Wallet is not connected")
            }

            const normalizedAddress = address.toLowerCase()
            const { message } = await authApi.getNonce(normalizedAddress)
            const signature = await signMessageAsync({ message })
            const { token } = await authApi.verifySignature({
                address: normalizedAddress,
                signature,
            })

            setSession({ token, walletAddress: normalizedAddress })

            return { token, walletAddress: normalizedAddress }
        },
    })

    function signOut() {
        clearSession()
        disconnect()
    }

    return {
        address,
        isConnected,
        signIn: signInMutation.mutateAsync,
        signInPending: signInMutation.isPending,
        signInError: signInMutation.error,
        signOut,
    }
}
