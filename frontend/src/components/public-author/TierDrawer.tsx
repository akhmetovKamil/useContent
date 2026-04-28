import type { AuthorAccessPolicyDto } from "@shared/types/content"
import { UsersRound } from "lucide-react"
import { Link } from "react-router-dom"

import { ConditionCard } from "@/components/public-author/ConditionCard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer"
import { describeConditionMode } from "@/utils/access-tier"

export function TierDrawer({
    authorSlug,
    onOpenChange,
    open,
    tier,
}: {
    authorSlug: string
    onOpenChange: (open: boolean) => void
    open: boolean
    tier: AuthorAccessPolicyDto | null
}) {
    if (!tier) {
        return null
    }

    return (
        <Drawer onOpenChange={onOpenChange} open={open}>
            <DrawerContent
                className="mx-auto max-w-4xl md:right-6 md:bottom-6 md:left-6 md:max-h-[86vh] md:rounded-[36px]"
                onClose={() => onOpenChange(false)}
            >
                <DrawerHeader className="text-center">
                    <Badge className="w-fit" variant={tier.hasAccess ? "success" : "warning"}>
                        {tier.hasAccess ? "Unlocked" : "Locked"}
                    </Badge>
                    <DrawerTitle>{tier.name}</DrawerTitle>
                    <DrawerDescription>
                        {tier.description || "Meet every required condition to unlock this tier."}
                    </DrawerDescription>
                </DrawerHeader>

                <div className="mt-6 grid gap-4 md:grid-cols-[0.8fr_1.2fr]">
                    <div className="rounded-[28px] border border-[var(--line)] bg-[var(--surface-strong)] p-5">
                        <div className="text-sm font-medium text-[var(--foreground)]">
                            Policy logic
                        </div>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                            {describeConditionMode(tier.conditionMode)}
                        </p>
                        <div className="mt-5 flex items-center gap-2 text-sm text-[var(--muted)]">
                            <UsersRound className="size-4" />
                            {tier.paidSubscribersCount} paid members
                        </div>
                    </div>

                    <div className="grid gap-3">
                        {tier.conditions.map((condition, index) => (
                            <ConditionCard
                                authorSlug={authorSlug}
                                condition={condition}
                                key={`${condition.type}-${index}`}
                            />
                        ))}

                        {tier.hasAccess ? (
                            <Button asChild className="rounded-full">
                                <Link to="#projects">View unlocked content</Link>
                            </Button>
                        ) : null}
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    )
}
