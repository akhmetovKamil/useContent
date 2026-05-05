import { Toaster as Sonner, toast } from "sonner"
import type { ToasterProps } from "sonner"

export { toast }

export function Toaster(props: ToasterProps) {
    return (
        <Sonner
            className="toaster group"
            closeButton
            position="top-right"
            richColors
            toastOptions={{
                classNames: {
                    actionButton: "group-[.toaster]:bg-[var(--primary)] group-[.toaster]:text-[var(--primary-foreground)]",
                    cancelButton: "group-[.toaster]:bg-[var(--muted-background)] group-[.toaster]:text-[var(--muted)]",
                    description: "group-[.toast]:text-[var(--muted)]",
                    toast: "group toast group-[.toaster]:border-[var(--line)] group-[.toaster]:bg-[var(--surface)] group-[.toaster]:text-[var(--foreground)]",
                },
            }}
            {...props}
        />
    )
}
