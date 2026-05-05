import { X } from "lucide-react"
import type * as React from "react"

import { useOverlayEffects } from "@/hooks/useOverlayEffects"
import { cn } from "@/utils/cn"
import { Button } from "./button"

interface SheetProps {
    children: React.ReactNode
    onOpenChange: (open: boolean) => void
    open: boolean
}

export function Sheet({ children, onOpenChange, open }: SheetProps) {
    useOverlayEffects(open, onOpenChange)

    if (!open) {
        return null
    }

    return (
        <div className="fixed inset-0 z-[120] h-[100dvh] w-[100dvw] overflow-hidden">
            <button
                aria-label="Close sheet"
                className="absolute inset-0 cursor-default bg-black/35 backdrop-blur-sm"
                onClick={() => onOpenChange(false)}
                type="button"
            />
            {children}
        </div>
    )
}

export function SheetContent({
    children,
    className,
    onClose,
}: React.ComponentProps<"aside"> & { onClose?: () => void }) {
    return (
        <aside
            className={cn(
                "absolute right-0 bottom-0 left-0 max-h-[88dvh] overflow-y-auto rounded-t-[34px] border border-[var(--line)] bg-[var(--surface)] p-6 shadow-2xl animate-in slide-in-from-bottom-10 md:top-0 md:left-auto md:h-full md:max-h-none md:w-full md:max-w-xl md:rounded-l-[34px] md:rounded-tr-none md:slide-in-from-right-10",
                className
            )}
        >
            {onClose ? (
                <Button
                    aria-label="Close"
                    className="absolute top-4 right-4 rounded-full"
                    onClick={onClose}
                    size="icon"
                    type="button"
                    variant="ghost"
                >
                    <X className="size-4" />
                </Button>
            ) : null}
            {children}
        </aside>
    )
}

export function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
    return <div className={cn("grid gap-2 pr-12", className)} {...props} />
}

export function SheetTitle({ className, ...props }: React.ComponentProps<"h2">) {
    return (
        <h2
            className={cn("font-[var(--serif)] text-3xl text-[var(--foreground)]", className)}
            {...props}
        />
    )
}

export function SheetDescription({ className, ...props }: React.ComponentProps<"p">) {
    return <p className={cn("text-sm leading-6 text-[var(--muted)]", className)} {...props} />
}
