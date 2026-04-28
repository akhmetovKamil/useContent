import type { ReactNode } from "react"

export function FlowCard({
    description,
    icon,
    title,
}: {
    description: string
    icon: ReactNode
    title: string
}) {
    return (
        <div className="rounded-[30px] border border-[var(--line)] bg-[radial-gradient(circle_at_top_left,var(--accent-soft),transparent_48%),var(--surface)] p-5 shadow-[0_16px_48px_rgba(15,23,42,0.05)]">
            <div className="grid size-11 place-items-center rounded-2xl bg-[var(--foreground)] text-[var(--background)]">
                {icon}
            </div>
            <div className="mt-4 font-medium text-[var(--foreground)]">{title}</div>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{description}</p>
        </div>
    )
}
