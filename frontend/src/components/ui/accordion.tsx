import { createContext, useContext, useState } from "react"
import type * as React from "react"

import { cn } from "@/utils/cn"

const AccordionItemContext = createContext<{
    open: boolean
    setOpen: (open: boolean) => void
} | null>(null)

function Accordion({ className, ...props }: React.ComponentProps<"div">) {
    return <div className={cn("grid gap-3", className)} {...props} />
}

function AccordionItem({ className, children, ...props }: React.ComponentProps<"div">) {
    const [open, setOpen] = useState(false)

    return (
        <AccordionItemContext.Provider value={{ open, setOpen }}>
            <div
                className={cn(
                    "group rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 transition-colors data-[open=true]:bg-[var(--surface-strong)]",
                    className
                )}
                data-open={open}
                {...props}
            >
                {children}
            </div>
        </AccordionItemContext.Provider>
    )
}

function AccordionTrigger({ className, children, ...props }: React.ComponentProps<"button">) {
    const context = useAccordionItemContext()

    return (
        <button
            className={cn(
                "flex w-full cursor-pointer items-center justify-between gap-4 text-left text-sm font-medium text-[var(--foreground)]",
                className
            )}
            onClick={() => context.setOpen(!context.open)}
            type="button"
            {...props}
        >
            <span>{children}</span>
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--accent-soft)] text-[var(--foreground)] transition-transform group-data-[open=true]:rotate-45">
                +
            </span>
        </button>
    )
}

function AccordionContent({ className, ...props }: React.ComponentProps<"div">) {
    const context = useAccordionItemContext()

    return (
        <div className="accordion-content" data-open={context.open}>
            <div
                className={cn(
                    "accordion-content-inner text-sm leading-6 text-[var(--muted)]",
                    className
                )}
                {...props}
            />
        </div>
    )
}

function useAccordionItemContext() {
    const context = useContext(AccordionItemContext)
    if (!context) {
        throw new Error("Accordion components must be used inside AccordionItem")
    }

    return context
}

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger }
