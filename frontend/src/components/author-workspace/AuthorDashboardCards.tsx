import { MetricCard } from "@/components/common/MetricCard"

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
                <MetricCard
                    description={metric.description}
                    key={metric.label}
                    label={metric.label}
                    to={metric.to}
                    value={metric.value}
                />
            ))}
        </div>
    )
}
