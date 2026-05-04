import { GripVertical } from "lucide-react"
import * as ResizablePrimitive from "react-resizable-panels"

import { cn } from "@/utils/cn"

function ResizablePanelGroup({
    className,
    direction,
    ...props
}: React.ComponentProps<typeof ResizablePrimitive.Group> & {
    direction?: "horizontal" | "vertical"
}) {
    return (
        <ResizablePrimitive.Group
            className={cn(
                "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
                className
            )}
            orientation={direction}
            {...props}
        />
    )
}

function ResizablePanel(props: React.ComponentProps<typeof ResizablePrimitive.Panel>) {
    return <ResizablePrimitive.Panel {...props} />
}

function ResizableHandle({
    withHandle,
    className,
    ...props
}: React.ComponentProps<typeof ResizablePrimitive.Separator> & {
    withHandle?: boolean
}) {
    return (
        <ResizablePrimitive.Separator
            className={cn(
                "relative flex w-px items-center justify-center bg-[var(--line)] after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:ring-1 focus-visible:ring-[var(--accent)] focus-visible:outline-none data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:translate-x-0 data-[panel-group-direction=vertical]:after:-translate-y-1/2",
                className
            )}
            {...props}
        >
            {withHandle ? (
                <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border border-[var(--line)] bg-[var(--surface)]">
                    <GripVertical className="size-2.5" />
                </div>
            ) : null}
        </ResizablePrimitive.Separator>
    )
}

export { ResizableHandle, ResizablePanel, ResizablePanelGroup }
