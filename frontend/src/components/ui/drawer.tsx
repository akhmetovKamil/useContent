import { X } from "lucide-react"
import type * as React from "react"

import { useOverlayEffects } from "@/hooks/useOverlayEffects"
import { cn } from "@/utils/cn"
import { Button } from "./button"

interface DrawerProps {
    children: React.ReactNode
    onOpenChange: (open: boolean) => void
    open: boolean
}

export function Drawer({ children, onOpenChange, open }: DrawerProps) {
    useOverlayEffects(open, onOpenChange)

    if (!open) {
        return null
    }

    return (
        <div className="fixed inset-0 z-[120] h-[100dvh] w-[100dvw] overflow-hidden">
            <button
                aria-label="Close drawer"
                className="absolute inset-0 cursor-default bg-black/40 backdrop-blur-md"
                onClick={() => onOpenChange(false)}
                type="button"
            />
            {children}
        </div>
    )
}

export function DrawerContent({
    children,
    className,
    onClose,
    side = "bottom",
}: React.ComponentProps<"aside"> & {
    onClose?: () => void
    side?: "bottom" | "right"
}) {
    return (
        <aside
            className={cn(
                "absolute z-10 overflow-y-auto border border-[var(--line)] bg-[var(--surface)] shadow-2xl",
                side === "bottom" &&
                    "right-0 bottom-0 left-0 max-h-[88dvh] rounded-t-[36px] p-5 animate-in slide-in-from-bottom-12 md:p-7",
                side === "right" &&
                    "top-0 right-0 h-full w-full max-w-3xl rounded-l-[36px] p-5 animate-in slide-in-from-right-12 md:p-7",
                className
            )}
        >
            {side === "bottom" ? (
                <div className="mx-auto mb-5 h-1.5 w-14 rounded-full bg-[var(--line)]" />
            ) : null}
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

export function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
    return <div className={cn("grid gap-2 pr-12", className)} {...props} />
}

export function DrawerTitle({ className, ...props }: React.ComponentProps<"h2">) {
    return (
        <h2
            className={cn("font-[var(--serif)] text-3xl text-[var(--foreground)]", className)}
            {...props}
        />
    )
}

export function DrawerDescription({ className, ...props }: React.ComponentProps<"p">) {
    return <p className={cn("text-sm leading-6 text-[var(--muted)]", className)} {...props} />
}
