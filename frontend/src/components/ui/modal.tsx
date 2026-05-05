import type * as React from "react"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/utils/cn"

interface ModalProps {
    children: React.ReactNode
    className?: string
    description?: string
    onOpenChange: (open: boolean) => void
    open: boolean
    title: string
}

export function Modal({ children, className, description, onOpenChange, open, title }: ModalProps) {
    return (
        <Dialog onOpenChange={onOpenChange} open={open}>
            <DialogContent
                className={cn(
                    "max-h-[min(90dvh,760px)] overflow-y-auto rounded-[28px] border-[var(--line)] bg-[var(--surface-strong)] text-[var(--foreground)] shadow-2xl sm:max-w-xl",
                    className
                )}
            >
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    {description ? (
                        <DialogDescription className="leading-6 text-[var(--muted)]">
                            {description}
                        </DialogDescription>
                    ) : null}
                </DialogHeader>
                {children}
            </DialogContent>
        </Dialog>
    )
}
