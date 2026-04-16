import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown } from "lucide-react"
import type * as React from "react"

import { cn } from "@/utils/cn"

function Select({
    onValueChange,
    ...props
}: React.ComponentProps<typeof SelectPrimitive.Root> & {
    onValueChange?: (value: string) => void
}) {
    return <SelectPrimitive.Root onValueChange={onValueChange} {...props} />
}

function SelectTrigger({
    className,
    children,
    ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger>) {
    return (
        <SelectPrimitive.Trigger
            className={cn(
                "flex h-11 w-full items-center justify-between gap-2 rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60",
                className
            )}
            {...props}
        >
            {children}
            <SelectPrimitive.Icon asChild>
                <ChevronDown className="size-4 shrink-0 text-[var(--muted)]" />
            </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
    )
}

function SelectValue(props: React.ComponentProps<typeof SelectPrimitive.Value>) {
    return <SelectPrimitive.Value {...props} />
}

function SelectContent({
    className,
    children,
    ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
    return (
        <SelectPrimitive.Portal>
            <SelectPrimitive.Content
                className={cn(
                    "z-50 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-md border border-[var(--line)] bg-[var(--surface-strong)] p-1 text-[var(--foreground)] shadow-xl",
                    className
                )}
                position="popper"
                sideOffset={6}
                {...props}
            >
                <SelectPrimitive.Viewport>{children}</SelectPrimitive.Viewport>
            </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
    )
}

function SelectItem({
    className,
    children,
    ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
    return (
        <SelectPrimitive.Item
            className={cn(
                "relative flex cursor-default select-none items-center rounded-sm py-2 pr-8 pl-3 text-sm outline-none transition-colors focus:bg-[var(--accent-soft)] data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                className
            )}
            {...props}
        >
            <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
            <SelectPrimitive.ItemIndicator className="absolute right-2 inline-flex items-center">
                <Check className="size-4" />
            </SelectPrimitive.ItemIndicator>
        </SelectPrimitive.Item>
    )
}

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue }
