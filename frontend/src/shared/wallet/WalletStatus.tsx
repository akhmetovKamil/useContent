import { useConnect } from "wagmi"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useWalletSession } from "@/features/auth/useWalletSession"
import { useAuthStore } from "@/shared/session/auth-store"

export function WalletStatus() {
    const { connect, connectors, isPending: connectPending } = useConnect()
    const { address, isConnected, signIn, signInPending, signInError, signOut } = useWalletSession()
    const token = useAuthStore((state) => state.token)

    const connector = connectors[0]
    const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null

    return (
        <div className="flex flex-wrap items-center gap-3 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-2 shadow-[var(--shadow)] backdrop-blur-sm">
            <div className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">wallet</div>
            {isConnected && shortAddress ? (
                <>
                    <div className="font-mono text-sm text-[var(--foreground)]">{shortAddress}</div>
                    <Badge variant={token ? "success" : "warning"}>
                        {token ? "session active" : "signature required"}
                    </Badge>
                    {!token ? (
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
                        onClick={signOut}
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
                    onClick={() => connector && connect({ connector })}
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
