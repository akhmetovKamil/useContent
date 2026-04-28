import { TicketCheck } from "lucide-react"
import { Link } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export function PublicTierCard() {
    return (
        <article className="grid min-h-[230px] gap-4 rounded-[30px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="mb-4 grid size-11 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
                        <TicketCheck className="size-5" />
                    </div>
                    <h3 className="font-[var(--serif)] text-2xl text-[var(--foreground)]">
                        Public
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                        Free posts and projects that do not require wallet ownership checks.
                    </p>
                </div>
                <Badge variant="success">open</Badge>
            </div>
            <Button asChild className="w-fit rounded-full" variant="outline">
                <Link to="#projects">Browse public content</Link>
            </Button>
        </article>
    )
}
