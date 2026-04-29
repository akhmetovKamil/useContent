import type { AccessPolicyPresetDto } from "@shared/types/access"
import { ArrowUpRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export function PolicyCard({
    onDelete,
    onEdit,
    onMakeDefault,
    policy,
}: {
    onDelete: () => void
    onEdit: () => void
    onMakeDefault: () => void
    policy: AccessPolicyPresetDto
}) {
    return (
        <div className="group rounded-[30px] border border-[var(--line)] bg-[linear-gradient(145deg,var(--surface),var(--surface-strong))] p-5 shadow-[0_18px_58px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow)]">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-[var(--serif)] text-2xl text-[var(--foreground)]">
                            {policy.name}
                        </h3>
                        {policy.isDefault ? <Badge variant="success">default</Badge> : null}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                        {policy.description || "No description"}
                    </p>
                </div>
                <Button
                    className="rounded-full"
                    onClick={onEdit}
                    size="icon"
                    type="button"
                    variant="ghost"
                >
                    <ArrowUpRight className="size-4" />
                </Button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
                <Badge>{policy.policy.root.type.toUpperCase()}</Badge>
                <Badge>{policy.postsCount} posts</Badge>
                <Badge>{policy.projectsCount} projects</Badge>
                <Badge>{policy.paidSubscribersCount} paid members</Badge>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
                {!policy.isDefault ? (
                    <Button
                        className="rounded-full"
                        onClick={onMakeDefault}
                        size="sm"
                        type="button"
                        variant="outline"
                    >
                        Make default
                    </Button>
                ) : null}
                {!policy.isDefault ? (
                    <Button
                        className="rounded-full"
                        onClick={onDelete}
                        size="sm"
                        type="button"
                        variant="destructive"
                    >
                        Delete
                    </Button>
                ) : null}
            </div>
        </div>
    )
}
