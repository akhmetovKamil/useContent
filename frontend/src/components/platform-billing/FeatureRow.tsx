import { Check, LockKeyhole } from "lucide-react"

export function FeatureRow({ active, label }: { active: boolean; label: string }) {
    const Icon = active ? Check : LockKeyhole

    return (
        <div className="flex items-center gap-2">
            <span
                className={[
                    "flex size-7 items-center justify-center rounded-full",
                    active
                        ? "bg-emerald-500/15 text-emerald-600"
                        : "bg-[var(--surface-strong)] text-[var(--muted)]",
                ].join(" ")}
            >
                <Icon className="size-3.5" />
            </span>
            <span className={active ? "text-[var(--foreground)]" : "text-[var(--muted)]"}>
                {label}
            </span>
        </div>
    )
}
