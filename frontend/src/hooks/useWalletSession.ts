import { normalizeAddressLike } from "@shared/utils/web3"
import { useCallback, useEffect } from "react"
import { useMutation } from "@tanstack/react-query"
import { useAccount, useDisconnect, useSignMessage } from "wagmi"

import { authApi } from "@/api/AuthApi"
import { queryClient } from "@/app/query-client"
import { isSessionExpired, useAuthStore } from "@/stores/auth-store"
import { useWorkspaceStore } from "@/stores/workspace-store"
import { emitSessionExpired } from "@/utils/session-events"

export function useWalletSession() {
    const { address, isConnected, status } = useAccount()
    const { signMessageAsync } = useSignMessage()
    const { disconnectAsync } = useDisconnect()
    const setSession = useAuthStore((state) => state.setSession)
    const clearSession = useAuthStore((state) => state.clearSession)
    const clearExpiredSession = useAuthStore((state) => state.clearExpiredSession)
    const token = useAuthStore((state) => state.token)
    const sessionWalletAddress = useAuthStore((state) => state.walletAddress)
    const expiresAt = useAuthStore((state) => state.expiresAt)
    const setMode = useWorkspaceStore((state) => state.setMode)
    const normalizedAddress = address ? normalizeAddressLike(address) : null
    const isSessionActive = Boolean(
        token &&
        expiresAt &&
        !isSessionExpired(expiresAt) &&
        normalizedAddress &&
        sessionWalletAddress === normalizedAddress
    )

    useEffect(() => {
        clearExpiredSession()
    }, [clearExpiredSession])

    useEffect(() => {
        if (!token) {
            return
        }

        if (status === "disconnected") {
            clearSession()
            queryClient.clear()
            setMode("reader")
            return
        }

        if (
            status === "connected" &&
            normalizedAddress &&
            sessionWalletAddress !== normalizedAddress
        ) {
            clearSession()
            queryClient.clear()
            setMode("reader")
        }
    }, [clearSession, normalizedAddress, sessionWalletAddress, setMode, status, token])

    useEffect(() => {
        if (!token || !expiresAt) {
            return
        }

        const delay = Date.parse(expiresAt) - Date.now()
        if (delay <= 0) {
            clearExpiredSession()
            queryClient.clear()
            setMode("reader")
            emitSessionExpired()
            return
        }

        const timeout = window.setTimeout(() => {
            clearExpiredSession()
            queryClient.clear()
            setMode("reader")
            emitSessionExpired()
        }, delay)

        return () => window.clearTimeout(timeout)
    }, [clearExpiredSession, expiresAt, setMode, token])

    const signInMutation = useMutation({
        mutationFn: async () => {
            if (!address) {
                throw new Error("Wallet is not connected")
            }

            const normalizedAddress = normalizeAddressLike(address)
            const { message } = await authApi.getNonce(normalizedAddress)
            const signature = await signMessageAsync({ message })
            const { token, expiresAt } = await authApi.verifySignature({
                address: normalizedAddress,
                signature,
            })

            setSession({ token, walletAddress: normalizedAddress, expiresAt })
            setMode("reader")

            return { token, walletAddress: normalizedAddress, expiresAt }
        },
    })

    const signOut = useCallback(async () => {
        clearSession()
        setMode("reader")
        queryClient.clear()
        try {
            await disconnectAsync()
        } catch {
            // Some injected connectors report disconnected without exposing a disconnect method.
        }
    }, [clearSession, disconnectAsync, setMode])

    return {
        address,
        isConnected,
        signIn: signInMutation.mutateAsync,
        signInPending: signInMutation.isPending,
        signInError: signInMutation.error,
        signOut,
        isSessionActive,
        sessionWalletAddress,
        expiresAt,
    }
}
