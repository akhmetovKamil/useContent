import * as React from "react"
import * as RechartsPrimitive from "recharts"

import { cn } from "@/utils/cn"

type ChartConfig = Record<
    string,
    {
        color?: string
        label?: React.ReactNode
    }
>

type ChartTooltipPayloadItem = {
    color?: string
    dataKey?: number | string
    name?: number | string
    value?: React.ReactNode
}

type ChartTooltipContentProps = React.ComponentProps<"div"> & {
    active?: boolean
    formatter?: (
        value: React.ReactNode,
        name: number | string | undefined,
        item: ChartTooltipPayloadItem,
        index: number,
        payload: ChartTooltipPayloadItem[]
    ) => React.ReactNode
    label?: React.ReactNode
    payload?: ChartTooltipPayloadItem[]
}

const ChartContext = React.createContext<{ config: ChartConfig } | null>(null)

function useChart() {
    const context = React.useContext(ChartContext)

    if (!context) {
        throw new Error("useChart must be used within a <ChartContainer />")
    }

    return context
}

function ChartContainer({
    children,
    className,
    config,
    ...props
}: React.ComponentProps<"div"> & {
    children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"]
    config: ChartConfig
}) {
    const chartId = React.useId().replaceAll(":", "")

    return (
        <ChartContext.Provider value={{ config }}>
            <div
                className={cn(
                    "flex aspect-video justify-center text-xs text-[var(--muted)] [&_.recharts-cartesian-axis-tick_text]:fill-[var(--muted)] [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-[var(--line)] [&_.recharts-tooltip-cursor]:stroke-[var(--line)]",
                    className
                )}
                data-chart={chartId}
                {...props}
            >
                <RechartsPrimitive.ResponsiveContainer>
                    {children}
                </RechartsPrimitive.ResponsiveContainer>
            </div>
        </ChartContext.Provider>
    )
}

function ChartTooltipContent({
    active,
    className,
    formatter,
    label,
    payload,
}: ChartTooltipContentProps) {
    const { config } = useChart()

    if (!active || !payload?.length) {
        return null
    }

    return (
        <div
            className={cn(
                "grid min-w-32 gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-2 text-xs shadow-xl",
                className
            )}
        >
            {label ? (
                <div className="font-medium text-[var(--foreground)]">{label}</div>
            ) : null}
            <div className="grid gap-1.5">
                {payload.map((item, index) => {
                    const key = String(item.dataKey ?? item.name ?? "")
                    const labelNode = config[key]?.label ?? item.name
                    const color =
                        item.color ?? config[key]?.color ?? "var(--primary)"
                    const value = formatter
                        ? formatter(item.value, item.name, item, index, payload)
                        : item.value

                    return (
                        <div
                            className="flex items-center justify-between gap-4"
                            key={`${key}-${item.name}`}
                        >
                            <div className="flex items-center gap-2 text-[var(--muted)]">
                                <span
                                    className="size-2 rounded-full"
                                    style={{ backgroundColor: color }}
                                />
                                <span>{labelNode}</span>
                            </div>
                            <span className="font-mono text-[var(--foreground)]">
                                {Array.isArray(value) ? value.join(" ") : value}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export { ChartContainer, ChartTooltipContent, type ChartConfig }
