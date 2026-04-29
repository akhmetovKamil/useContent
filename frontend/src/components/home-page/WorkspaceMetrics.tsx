import { MetricsGrid } from "@/components/common/MetricsGrid"

interface WorkspaceMetricsProps {
    metrics: Array<{ label: string; value: string }>
}

export function WorkspaceMetrics({ metrics }: WorkspaceMetricsProps) {
    return <MetricsGrid metrics={metrics} />
}
