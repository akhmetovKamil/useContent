import { Check, Network } from "lucide-react"

import { AssetAvatar } from "@/components/common/AssetAvatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/utils/cn"
import { getChainDisplayConfig, supportedChainOptions } from "@/utils/config/chains"

interface ChainPickerProps {
    className?: string
    onChange: (chainId: number) => void
    value: number
}

export function ChainPicker({ className, onChange, value }: ChainPickerProps) {
    const selectedChain = supportedChainOptions.find((chain) => chain.id === value)

    return (
        <div className={cn("grid gap-3", className)}>
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="inline-flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
                        <Network className="size-4 text-[var(--accent)]" />
                        Network
                    </div>
                    <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                        Choose the EVM network where this rule or plan will be checked.
                    </p>
                </div>
                {selectedChain ? (
                    <Badge variant={selectedChain.testnet ? "warning" : "success"}>
                        {selectedChain.testnet ? "testnet" : "mainnet"}
                    </Badge>
                ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
                {supportedChainOptions.map((chain) => (
                    <button
                        className={cn(
                            "group relative overflow-hidden rounded-[24px] border p-4 text-left transition duration-200 hover:-translate-y-0.5",
                            value === chain.id
                                ? "border-[var(--accent)] bg-[var(--accent-soft)] shadow-[var(--shadow)]"
                                : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--accent)]",
                        )}
                        key={chain.id}
                        onClick={() => onChange(chain.id)}
                        type="button"
                    >
                        <div
                            className={cn(
                                "absolute inset-x-0 top-0 h-20 opacity-15 blur-2xl transition group-hover:opacity-25",
                                `bg-gradient-to-r ${chain.accent}`,
                            )}
                        />
                        <div className="relative flex items-center gap-3">
                            <AssetAvatar
                                accent={getChainDisplayConfig(chain.id).accent}
                                label={getChainDisplayConfig(chain.id).icon}
                                variant="circle"
                            />
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-[var(--foreground)]">
                                        {chain.name}
                                    </span>
                                    {value === chain.id ? (
                                        <Check className="size-4 text-[var(--accent)]" />
                                    ) : null}
                                </div>
                                <div className="mt-1 font-mono text-xs text-[var(--muted)]">
                                    Chain ID {chain.id}
                                </div>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    )
}
