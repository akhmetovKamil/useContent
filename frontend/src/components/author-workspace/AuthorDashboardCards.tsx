import { MetricsGrid, type MetricGridItem } from "@/components/common/MetricsGrid"

export function AuthorMetrics({ metrics }: { metrics: MetricGridItem[] }) {
    return <MetricsGrid className="mt-6 grid gap-4 md:grid-cols-4" metrics={metrics} />
}
