import { Link } from "react-router-dom"

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eyebrow } from "@/components/ui/page"

interface Metric {
    label: string
    value: string
}

interface Action {
    description: string
    label: string
    to: string
}

export function AuthorMetrics({ metrics }: { metrics: Metric[] }) {
    return (
        <div className="mt-6 grid gap-4 md:grid-cols-4">
            {metrics.map((metric) => (
                <Card key={metric.label}>
                    <CardHeader>
                        <Eyebrow className="tracking-[0.3em]">{metric.label}</Eyebrow>
                        <CardTitle className="truncate text-2xl">{metric.value}</CardTitle>
                    </CardHeader>
                </Card>
            ))}
        </div>
    )
}

export function AuthorActions({ actions }: { actions: Action[] }) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {actions.map((action) => (
                <Link key={action.to} to={action.to}>
                    <Card className="h-full transition-colors hover:bg-[var(--accent-soft)]">
                        <CardHeader>
                            <CardTitle>{action.label}</CardTitle>
                            <CardDescription>{action.description}</CardDescription>
                        </CardHeader>
                    </Card>
                </Link>
            ))}
        </div>
    )
}
