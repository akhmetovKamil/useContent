import type { AuthorAccessPolicyDto } from "@shared/types/content"
import { ShieldCheck, UsersRound } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatConditionChip } from "@/utils/access-tier"

export function TierCard({ onOpen, policy }: { onOpen: () => void; policy: AuthorAccessPolicyDto }) {
    return (
        <article className="grid min-h-[230px] gap-4 rounded-[30px] border border-[var(--line)] bg-[radial-gradient(circle_at_top_left,var(--accent-soft),transparent_42%),var(--surface)] p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow)]">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="mb-4 grid size-11 place-items-center rounded-2xl bg-[var(--foreground)] text-[var(--background)]">
                        <ShieldCheck className="size-5" />
                    </div>
                    <h3 className="font-[var(--serif)] text-2xl text-[var(--foreground)]">
                        {policy.name}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                        {policy.description || "Unlock this tier by meeting its conditions."}
                    </p>
                </div>
                <Badge variant={policy.hasAccess ? "success" : "warning"}>
                    {policy.hasAccess ? "unlocked" : "locked"}
                </Badge>
            </div>
            <div className="flex flex-wrap gap-2">
                <Badge>{policy.conditionMode.toUpperCase()}</Badge>
                {policy.conditions.map((condition, index) => (
                    <Badge key={`${condition.type}-${index}`}>
                        {formatConditionChip(condition)}
                    </Badge>
                ))}
            </div>
            <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                    <UsersRound className="size-4" />
                    {policy.paidSubscribersCount} paid members
                </div>
                <Button className="rounded-full" onClick={onOpen} type="button">
                    {policy.hasAccess ? "View tier" : "Unlock tier"}
                </Button>
            </div>
        </article>
    )
}
