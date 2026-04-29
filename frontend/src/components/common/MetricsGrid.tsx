import { MetricCard } from "@/components/common/MetricCard"

export interface MetricGridItem {
    description?: string
    label: string
    to?: string
    value: string
}

export function MetricsGrid({
    className = "grid gap-4 md:grid-cols-4",
    metrics,
}: {
    className?: string
    metrics: MetricGridItem[]
}) {
    return (
        <section className={className}>
            {metrics.map((metric) => (
                <MetricCard
                    description={metric.description}
                    key={metric.label}
                    label={metric.label}
                    to={metric.to}
                    value={metric.value}
                />
            ))}
        </section>
    )
}
