import { useConnect } from "wagmi"

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
                    <div
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                            token
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                        }`}
                    >
                        {token ? "session active" : "signature required"}
                    </div>
                    {!token ? (
                        <button
                            className="rounded-full bg-[var(--accent)] px-3 py-1 text-sm font-medium text-[var(--accent-foreground)] disabled:opacity-60"
                            disabled={signInPending}
                            onClick={() => void signIn()}
                            type="button"
                        >
                            {signInPending ? "Signing..." : "Sign in"}
                        </button>
                    ) : null}
                    <button
                        className="rounded-full border border-[var(--line)] px-3 py-1 text-sm font-medium text-[var(--foreground)]"
                        onClick={signOut}
                        type="button"
                    >
                        Disconnect
                    </button>
                </>
            ) : (
                <button
                    className="rounded-full bg-[var(--accent)] px-3 py-1 text-sm font-medium text-[var(--accent-foreground)] disabled:opacity-60"
                    disabled={!connector || connectPending}
                    onClick={() => connector && connect({ connector })}
                    type="button"
                >
                    {connectPending ? "Connecting..." : "Connect wallet"}
                </button>
            )}
            {signInError ? (
                <div className="basis-full text-xs text-rose-600">{signInError.message}</div>
            ) : null}
        </div>
    )
}
