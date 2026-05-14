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
                "group/resize-handle relative flex w-px items-center justify-center bg-transparent after:absolute after:inset-y-0 after:left-1/2 after:w-px after:-translate-x-1/2 after:bg-[var(--line)] focus-visible:ring-1 focus-visible:ring-[var(--accent)] focus-visible:outline-none data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:inset-x-0 data-[panel-group-direction=vertical]:after:top-1/2 data-[panel-group-direction=vertical]:after:h-px data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0",
                className
            )}
            {...props}
        >
            {withHandle ? (
                <div className="absolute left-1/2 top-1/2 z-10 flex h-5 w-3 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)] shadow-sm group-data-[panel-group-direction=vertical]/resize-handle:h-3 group-data-[panel-group-direction=vertical]/resize-handle:w-5">
                    <GripVertical className="size-2.5 group-data-[panel-group-direction=vertical]/resize-handle:rotate-90" />
                </div>
            ) : null}
        </ResizablePrimitive.Separator>
    )
}

export { ResizableHandle, ResizablePanel, ResizablePanelGroup }
