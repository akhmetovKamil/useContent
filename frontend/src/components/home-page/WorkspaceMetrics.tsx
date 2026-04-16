import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Eyebrow } from "@/components/ui/page"

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

function MetricCard({ label, value }: { label: string; value: string }) {
    return (
        <Card>
            <CardHeader>
                <Eyebrow className="tracking-[0.3em]">{label}</Eyebrow>
                <CardTitle className="text-2xl">{value}</CardTitle>
            </CardHeader>
        </Card>
    )
}
