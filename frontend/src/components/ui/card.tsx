import type * as React from "react"

import { cn } from "@/utils/cn"

function Card({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            className={cn(
                "rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--foreground)]",
                className
            )}
            {...props}
        />
    )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
    return <div className={cn("grid gap-1.5 p-5", className)} {...props} />
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
    return <div className={cn("text-xl font-medium", className)} {...props} />
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
    return <div className={cn("text-sm leading-6 text-[var(--muted)]", className)} {...props} />
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
    return <div className={cn("p-5 pt-0", className)} {...props} />
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
    return <div className={cn("flex items-center p-5 pt-0", className)} {...props} />
}

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle }
