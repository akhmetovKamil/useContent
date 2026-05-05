import { useConnect, useDisconnect } from "wagmi"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useWalletSession } from "@/hooks/useWalletSession"
import { isSessionExpired, useAuthStore } from "@/stores/auth-store"
import { shortenWalletAddress } from "@shared/utils/web3"

export function WalletStatus() {
    const { connectAsync, connectors, isPending: connectPending } = useConnect()
    const { disconnectAsync } = useDisconnect()
    const { address, isConnected, signIn, signInPending, signInError, signOut, isSessionActive } =
        useWalletSession()
    const token = useAuthStore((state) => state.token)
    const expiresAt = useAuthStore((state) => state.expiresAt)

    const connector = connectors[0]
    const shortAddress = address ? shortenWalletAddress(address) : null
    const hasExpiredToken = Boolean(token && isSessionExpired(expiresAt))

    async function handleConnect() {
        if (!connector || connectPending) {
            return
        }

        try {
            if (isConnected) {
                await disconnectAsync()
            }
            await connectAsync({ connector })
        } catch (error) {
            const message = error instanceof Error ? error.message : ""
            if (!message.toLowerCase().includes("already connected")) {
                return
            }

            try {
                await disconnectAsync()
            } catch {
                // The injected connector can be connected in the wallet while wagmi state is stale.
            }
            await connectAsync({ connector })
        }
    }

    return (
        <div className="flex flex-wrap items-center gap-3 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-2 shadow-[var(--shadow)] backdrop-blur-sm">
            <div className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">wallet</div>
            {isConnected && shortAddress ? (
                <>
                    <div className="font-mono text-sm text-[var(--foreground)]">{shortAddress}</div>
                    <Badge variant={isSessionActive ? "success" : "warning"}>
                        {isSessionActive
                            ? "session active"
                            : hasExpiredToken
                              ? "session expired"
                              : "signature required"}
                    </Badge>
                    {!isSessionActive ? (
                        <Button
                            className="rounded-full"
                            disabled={signInPending}
                            onClick={() => void signIn()}
                            size="sm"
                            type="button"
                        >
                            {signInPending ? "Signing..." : "Sign in"}
                        </Button>
                    ) : null}
                    <Button
                        className="rounded-full"
                        onClick={() => void signOut()}
                        size="sm"
                        type="button"
                        variant="outline"
                    >
                        Disconnect
                    </Button>
                </>
            ) : (
                <Button
                    className="rounded-full"
                    disabled={!connector || connectPending}
                    onClick={() => void handleConnect()}
                    size="sm"
                    type="button"
                >
                    {connectPending ? "Connecting..." : "Connect wallet"}
                </Button>
            )}
            {signInError ? (
                <div className="basis-full text-xs text-rose-600">{signInError.message}</div>
            ) : null}
        </div>
    )
}
