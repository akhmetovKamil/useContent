import { Database, Megaphone, PackageCheck } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function FeatureMatrix() {
    const items = [
        {
            icon: PackageCheck,
            title: "Publishing",
            text: "Free authors can keep publishing posts while project spaces stay reserved for Basic.",
        },
        {
            icon: Database,
            title: "Storage quota",
            text: "Uploads are checked against the current quota before files are written to storage.",
        },
        {
            icon: Megaphone,
            title: "Homepage promo",
            text: "A planned Basic feature for promoting selected posts on the platform home page.",
        },
    ]

    return (
        <Card className="rounded-[30px]">
            <CardHeader>
                <CardTitle>What the plan controls</CardTitle>
                <CardDescription>
                    These limits belong to author-to-platform billing, not reader subscriptions.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
                {items.map((item) => {
                    const Icon = item.icon
                    return (
                        <div
                            className="rounded-[24px] border border-[var(--line)] bg-[var(--surface-strong)] p-4"
                            key={item.title}
                        >
                            <Icon className="size-5 text-[var(--accent)]" />
                            <div className="mt-3 font-medium">{item.title}</div>
                            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                                {item.text}
                            </p>
                        </div>
                    )
                })}
            </CardContent>
        </Card>
    )
}
