import { Check, Coins, Diamond, ExternalLink, ImageIcon, Network, Search } from "lucide-react"
import type { ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Modal } from "@/components/ui/modal"
import { cn } from "@/utils/cn"
import { getChainDisplayConfig, supportedChainOptions } from "@/utils/config/chains"
import { getTokenPresets, type TokenPreset } from "@/utils/config/tokens"

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
                                : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--accent)]"
                        )}
                        key={chain.id}
                        onClick={() => onChange(chain.id)}
                        type="button"
                    >
                        <div
                            className={cn(
                                "absolute inset-x-0 top-0 h-20 opacity-15 blur-2xl transition group-hover:opacity-25",
                                `bg-gradient-to-r ${chain.accent}`
                            )}
                        />
                        <div className="relative flex items-center gap-3">
                            <ChainAvatar chainId={chain.id} />
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

interface TokenPickerProps {
    chainId: number
    onAddressChange: (address: string) => void
    onCustomDecimalsChange: (decimals: string) => void
    onTokenChange: (tokenId: string, token: TokenPreset) => void
    selectedTokenId: string
    tokenAddress: string
    customDecimals: string
    lookup?: {
        error?: string
        name?: string
        state: "idle" | "loading" | "success" | "error"
        symbol?: string
    }
}

export function TokenPicker({
    chainId,
    customDecimals,
    lookup,
    onAddressChange,
    onCustomDecimalsChange,
    onTokenChange,
    selectedTokenId,
    tokenAddress,
}: TokenPickerProps) {
    const presets = getTokenPresets(chainId)
    const selectedToken = presets.find((preset) => getTokenId(preset) === selectedTokenId)

    return (
        <div className="grid gap-4 rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-4">
            <div>
                <div className="inline-flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
                    <Coins className="size-4 text-[var(--accent)]" />
                    Payment token
                </div>
                <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                    Pick a known token or connect a custom ERC-20 by address. Metadata is read from
                    the selected network when possible.
                </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
                {presets.map((preset) => (
                    <TokenOption
                        key={getTokenId(preset)}
                        onClick={() => onTokenChange(getTokenId(preset), preset)}
                        selected={selectedTokenId === getTokenId(preset)}
                        token={preset}
                    />
                ))}
            </div>

            {selectedToken?.kind === "custom" ? (
                <div className="grid gap-3 rounded-[24px] border border-dashed border-[var(--line)] bg-[var(--surface-strong)] p-4 md:grid-cols-[1fr_140px]">
                    <Label>
                        ERC-20 contract address
                        <Input
                            className="font-mono"
                            onChange={(event) => onAddressChange(event.target.value)}
                            placeholder="0x..."
                            value={tokenAddress}
                        />
                    </Label>
                    <Label>
                        Decimals
                        <Input
                            onChange={(event) => onCustomDecimalsChange(event.target.value)}
                            value={customDecimals}
                        />
                    </Label>
                    <div className="md:col-span-2">
                        <TokenLookupState lookup={lookup} />
                    </div>
                </div>
            ) : null}
        </div>
    )
}

interface TokenAmountInputProps {
    amount: string
    baseUnits: string
    onAmountChange: (amount: string) => void
    symbol?: string
}

export function TokenAmountInput({
    amount,
    baseUnits,
    onAmountChange,
    symbol,
}: TokenAmountInputProps) {
    return (
        <div className="rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-4">
            <Label>
                Subscription amount
                <div className="relative mt-1">
                    <Input
                        className="h-14 rounded-2xl pr-24 text-lg"
                        onChange={(event) => onAmountChange(event.target.value)}
                        placeholder="10"
                        value={amount}
                    />
                    <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 font-mono text-xs text-[var(--muted)]">
                        {symbol ?? "TOKEN"}
                    </span>
                </div>
            </Label>
            <div className="mt-3 rounded-2xl bg-[var(--surface-strong)] px-3 py-2 text-xs text-[var(--muted)]">
                On-chain value: <span className="break-all font-mono">{baseUnits || "0"}</span>
            </div>
        </div>
    )
}

interface Web3SummaryPanelProps {
    children?: ReactNode
    items: Array<{ label: string; value: string | null | undefined }>
    title: string
}

export function Web3SummaryPanel({ children, items, title }: Web3SummaryPanelProps) {
    return (
        <div className="grid gap-3 rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
                <ExternalLink className="size-4 text-[var(--accent)]" />
                {title}
            </div>
            <div className="grid gap-2 text-xs text-[var(--muted)]">
                {items.map((item) =>
                    item.value ? (
                        <div className="grid gap-1" key={item.label}>
                            <span className="uppercase tracking-[0.18em]">{item.label}</span>
                            <span className="break-all font-mono text-[var(--foreground)]">
                                {item.value}
                            </span>
                        </div>
                    ) : null
                )}
            </div>
            {children}
        </div>
    )
}

interface AddressInputProps {
    description?: string
    label: string
    onChange: (value: string) => void
    placeholder?: string
    value: string
}

export function AddressInput({
    description,
    label,
    onChange,
    placeholder,
    value,
}: AddressInputProps) {
    return (
        <Label>
            {label}
            <div className="relative mt-1">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--muted)]" />
                <Input
                    className="font-mono pl-10"
                    onChange={(event) => onChange(event.target.value)}
                    placeholder={placeholder ?? "0x..."}
                    value={value}
                />
            </div>
            {description ? (
                <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">
                    {description}
                </span>
            ) : null}
        </Label>
    )
}

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
                    config?.accent ?? "from-slate-400 to-neutral-700"
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

interface Web3HelpModalProps {
    description: string
    onOpenChange: (open: boolean) => void
    open: boolean
    title: string
}

export function Web3HelpModal({ description, onOpenChange, open, title }: Web3HelpModalProps) {
    return (
        <Modal description={description} onOpenChange={onOpenChange} open={open} title={title}>
            <div className="grid gap-3 text-sm leading-6 text-[var(--muted)]">
                <p>
                    For token rules, the backend reads `balanceOf(wallet)` through the configured
                    RPC endpoint. For NFT rules, ERC-721 can check a concrete token ID or the whole
                    collection balance, while ERC-1155 needs a token ID.
                </p>
                <p>
                    If RPC is not configured for the selected network, the condition fails safely
                    and locked content remains hidden.
                </p>
            </div>
        </Modal>
    )
}

function ChainAvatar({ chainId }: { chainId: number }) {
    const config = getChainDisplayConfig(chainId)

    return (
        <span
            className={cn(
                "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-semibold text-white shadow-lg",
                config.accent
            )}
        >
            {config.icon}
        </span>
    )
}

function TokenOption({
    onClick,
    selected,
    token,
}: {
    onClick: () => void
    selected: boolean
    token: TokenPreset
}) {
    return (
        <button
            className={cn(
                "relative overflow-hidden rounded-[24px] border p-4 text-left transition duration-200 hover:-translate-y-0.5",
                selected
                    ? "border-[var(--accent)] bg-[var(--accent-soft)] shadow-[var(--shadow)]"
                    : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--accent)]",
                token.disabled && "cursor-not-allowed opacity-55"
            )}
            disabled={token.disabled}
            onClick={onClick}
            type="button"
        >
            <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-[var(--foreground)] font-mono text-xs font-semibold text-[var(--surface)]">
                    {token.kind === "custom" ? (
                        <Diamond className="size-4" />
                    ) : (
                        token.symbol.slice(0, 4)
                    )}
                </span>
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-[var(--foreground)]">{token.symbol}</span>
                        {selected ? <Check className="size-4 text-[var(--accent)]" /> : null}
                        {token.disabled ? <Badge>soon</Badge> : null}
                    </div>
                    <div className="mt-1 text-xs text-[var(--muted)]">{token.name}</div>
                </div>
            </div>
            <p className="mt-3 text-xs leading-5 text-[var(--muted)]">{token.helper}</p>
        </button>
    )
}

function TokenLookupState({ lookup }: { lookup?: TokenPickerProps["lookup"] }) {
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

export function getTokenId(token: TokenPreset) {
    return token.address?.toLowerCase() ?? token.kind
}
