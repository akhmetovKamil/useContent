import { Link } from "react-router-dom"

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eyebrow } from "@/components/ui/page"

interface MetricCardProps {
    description?: string
    label: string
    to?: string
    value: string
}

export function MetricCard({ description, label, to, value }: MetricCardProps) {
    const card = (
        <Card className={to ? "transition-colors hover:bg-[var(--accent-soft)]" : ""}>
            <CardHeader>
                <Eyebrow className="tracking-[0.3em]">{label}</Eyebrow>
                <CardTitle className="truncate text-2xl">{value}</CardTitle>
                {description ? <CardDescription>{description}</CardDescription> : null}
            </CardHeader>
        </Card>
    )

    return to ? <Link to={to}>{card}</Link> : card
}
