import { useAccount, useConnect, useDisconnect } from "wagmi"

export function WalletStatus() {
    const { address, isConnected } = useAccount()
    const { connect, connectors, isPending } = useConnect()
    const { disconnect } = useDisconnect()

    const connector = connectors[0]

    return (
        <div className="flex items-center gap-3 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-2 shadow-[var(--shadow)] backdrop-blur-sm">
            <div className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">wallet</div>
            {isConnected && address ? (
                <>
                    <div className="font-mono text-sm text-[var(--foreground)]">
                        {address.slice(0, 6)}...{address.slice(-4)}
                    </div>
                    <button
                        className="rounded-full bg-[var(--accent)] px-3 py-1 text-sm font-medium text-[var(--accent-foreground)]"
                        onClick={() => disconnect()}
                        type="button"
                    >
                        Disconnect
                    </button>
                </>
            ) : (
                <button
                    className="rounded-full bg-[var(--accent)] px-3 py-1 text-sm font-medium text-[var(--accent-foreground)] disabled:opacity-60"
                    disabled={!connector || isPending}
                    onClick={() => connector && connect({ connector })}
                    type="button"
                >
                    {isPending ? "Connecting..." : "Connect wallet"}
                </button>
            )}
        </div>
    )
}
