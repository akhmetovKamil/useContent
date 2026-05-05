import { X } from "lucide-react"
import type * as React from "react"

import { useOverlayEffects } from "@/hooks/useOverlayEffects"
import { cn } from "@/utils/cn"
import { Button } from "./button"
import { Card, CardContent, CardHeader, CardTitle } from "./card"

interface ModalProps {
    children: React.ReactNode
    className?: string
    description?: string
    onOpenChange: (open: boolean) => void
    open: boolean
    title: string
}

export function Modal({ children, className, description, onOpenChange, open, title }: ModalProps) {
    useOverlayEffects(open, onOpenChange)

    if (!open) {
        return null
    }

    return (
        <div className="fixed inset-0 z-[120] grid h-[100dvh] w-[100dvw] place-items-center overflow-hidden bg-black/45 p-4 backdrop-blur-sm">
            <button
                aria-label="Close modal"
                className="absolute inset-0 cursor-default"
                onClick={() => onOpenChange(false)}
                type="button"
            />
            <Card
                className={cn(
                    "relative z-10 max-h-[min(90dvh,760px)] w-full max-w-xl overflow-y-auto rounded-[28px] shadow-2xl",
                    className
                )}
            >
                <CardHeader className="grid grid-cols-[1fr_auto] items-start gap-4">
                    <div>
                        <CardTitle>{title}</CardTitle>
                        {description ? (
                            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                                {description}
                            </p>
                        ) : null}
                    </div>
                    <Button
                        aria-label="Close"
                        className="rounded-full"
                        onClick={() => onOpenChange(false)}
                        size="icon"
                        type="button"
                        variant="ghost"
                    >
                        <X className="size-4" />
                    </Button>
                </CardHeader>
                <CardContent>{children}</CardContent>
            </Card>
        </div>
    )
}
