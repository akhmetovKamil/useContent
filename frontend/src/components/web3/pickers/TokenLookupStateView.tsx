import type { TokenLookupState } from "@/types/web3"

export function TokenLookupStateView({ lookup }: { lookup?: TokenLookupState }) {
    if (!lookup || lookup.state === "idle") {
        return (
            <p className="text-xs leading-5 text-[var(--muted)]">
                Paste a token address to read its symbol, name, and decimals automatically.
            </p>
        )
    }

    if (lookup.state === "loading") {
        return <p className="text-xs text-[var(--muted)]">Reading ERC-20 metadata...</p>
    }

    if (lookup.state === "success") {
        return (
            <p className="text-xs text-emerald-700">
                Detected {lookup.name || "token"} {lookup.symbol ? `(${lookup.symbol})` : ""}.
            </p>
        )
    }

    return <p className="text-xs text-amber-700">{lookup.error}</p>
}
