import { FolderKanban, ArrowUpRight } from "lucide-react"
import { Link } from "react-router-dom"

import { Badge } from "@/components/ui/badge"

interface AttachedProjectCardProps {
    href: string
    index: number
}

export function AttachedProjectCard({ href, index }: AttachedProjectCardProps) {
    return (
        <Link
            className="group flex items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
            to={href}
        >
            <span className="flex min-w-0 items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--surface-strong)] text-[var(--foreground)]">
                    <FolderKanban className="size-5" />
                </span>
                <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-[var(--foreground)]">
                        Attached project {index + 1}
                    </span>
                    <span className="mt-1 block text-xs text-[var(--muted)]">
                        Open project workspace and files
                    </span>
                </span>
            </span>
            <span className="flex items-center gap-2">
                <Badge className="rounded-full">Project</Badge>
                <ArrowUpRight className="size-4 text-[var(--muted)] transition group-hover:text-[var(--foreground)]" />
            </span>
        </Link>
    )
}
