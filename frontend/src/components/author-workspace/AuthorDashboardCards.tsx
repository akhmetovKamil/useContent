import { Link } from "react-router-dom"

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eyebrow } from "@/components/ui/page"

interface Metric {
    description: string
    label: string
    to?: string
    value: string
}

export function AuthorMetrics({ metrics }: { metrics: Metric[] }) {
    return (
        <div className="mt-6 grid gap-4 md:grid-cols-4">
            {metrics.map((metric) => (
                <MetricCard key={metric.label} metric={metric} />
            ))}
        </div>
    )
}

function MetricCard({ metric }: { metric: Metric }) {
    const card = (
        <Card className={metric.to ? "transition-colors hover:bg-[var(--accent-soft)]" : ""}>
            <CardHeader>
                <Eyebrow className="tracking-[0.3em]">{metric.label}</Eyebrow>
                <CardTitle className="truncate text-2xl">{metric.value}</CardTitle>
                <CardDescription>{metric.description}</CardDescription>
            </CardHeader>
        </Card>
    )

    return metric.to ? <Link to={metric.to}>{card}</Link> : card
}
