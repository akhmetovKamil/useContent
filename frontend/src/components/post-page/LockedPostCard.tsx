import { LockKeyhole } from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardTitle } from "@/components/ui/card"

export function LockedPostCard({ slug }: { slug: string }) {
    return (
        <Card className="rounded-[32px]">
            <CardContent className="grid gap-4 p-6">
                <div className="grid size-12 place-items-center rounded-2xl bg-[var(--surface-strong)]">
                    <LockKeyhole className="size-5" />
                </div>
                <div>
                    <CardTitle>This post is locked</CardTitle>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                        Open the author profile to view access tiers and unlock this content with a
                        subscription or ownership condition.
                    </p>
                </div>
                <Button asChild className="w-fit rounded-full">
                    <Link to={`/authors/${slug}`}>View access tiers</Link>
                </Button>
            </CardContent>
        </Card>
    )
}
