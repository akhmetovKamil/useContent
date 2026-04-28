import { Modal } from "@/components/ui/modal"

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
