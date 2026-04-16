import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import type * as React from "react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors outline-none disabled:pointer-events-none disabled:opacity-60",
    {
        variants: {
            variant: {
                default: "bg-[var(--accent)] text-[var(--accent-foreground)] hover:opacity-90",
                destructive: "border border-rose-200 text-rose-600 hover:bg-rose-50",
                outline:
                    "border border-[var(--line)] bg-transparent text-[var(--foreground)] hover:bg-[var(--accent-soft)]",
                secondary:
                    "bg-[var(--accent-soft)] text-[var(--foreground)] hover:bg-[var(--surface-strong)]",
                ghost: "text-[var(--foreground)] hover:bg-[var(--accent-soft)]",
                link: "text-[var(--foreground)] underline-offset-4 hover:underline",
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-9 px-3",
                lg: "h-11 px-5",
                icon: "size-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

function Button({
    asChild = false,
    className,
    size,
    variant,
    ...props
}: React.ComponentProps<"button"> &
    VariantProps<typeof buttonVariants> & {
        asChild?: boolean
    }) {
    const Comp = asChild ? Slot : "button"

    return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />
}

export { Button, buttonVariants }
