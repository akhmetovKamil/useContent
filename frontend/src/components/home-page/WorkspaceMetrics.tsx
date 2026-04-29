import { MetricCard } from "@/components/common/MetricCard"

interface WorkspaceMetricsProps {
    metrics: Array<{ label: string; value: string }>
}

export function WorkspaceMetrics({ metrics }: WorkspaceMetricsProps) {
    return (
        <section className="grid gap-4 md:grid-cols-4">
            {metrics.map((metric) => (
                <MetricCard key={metric.label} label={metric.label} value={metric.value} />
            ))}
        </section>
    )
}
