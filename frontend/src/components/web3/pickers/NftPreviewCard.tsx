import { ImageIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/utils/cn"
import { getChainDisplayConfig } from "@/utils/config/chains"

interface NftPreviewCardProps {
    chainId: string
    contractAddress: string
    standard: "erc721" | "erc1155"
    tokenId: string
}

export function NftPreviewCard({
    chainId,
    contractAddress,
    standard,
    tokenId,
}: NftPreviewCardProps) {
    const chain = Number(chainId)
    const config = Number.isFinite(chain) ? getChainDisplayConfig(chain) : null

    return (
        <div className="overflow-hidden rounded-[28px] border border-[var(--line)] bg-[var(--surface)]">
            <div
                className={cn(
                    "grid aspect-[1.6] place-items-center bg-gradient-to-br",
                    config?.accent ?? "from-slate-400 to-neutral-700",
                )}
            >
                <div className="grid size-24 place-items-center rounded-[32px] border border-white/30 bg-white/20 text-white shadow-2xl backdrop-blur">
                    <ImageIcon className="size-10" />
                </div>
            </div>
            <div className="grid gap-3 p-4">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="font-medium text-[var(--foreground)]">
                            {standard.toUpperCase()} access pass
                        </div>
                        <div className="mt-1 text-xs text-[var(--muted)]">
                            {tokenId ? `Token #${tokenId}` : "Any token from this collection"}
                        </div>
                    </div>
                    <Badge>{chainId || "chain"}</Badge>
                </div>
                <div className="break-all rounded-2xl bg-[var(--surface-strong)] p-3 font-mono text-xs text-[var(--muted)]">
                    {contractAddress || "0x..."}
                </div>
            </div>
        </div>
    )
}
