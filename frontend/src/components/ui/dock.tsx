import {
    createContext,
    useContext,
    useRef,
    useState,
    type CSSProperties,
} from "react"
import type * as React from "react"

import { cn } from "@/utils/cn"

const DockContext = createContext<{ mouseX: number | null }>({ mouseX: null })

function Dock({ className, ...props }: React.ComponentProps<"div">) {
    const [mouseX, setMouseX] = useState<number | null>(null)

    return (
        <DockContext.Provider value={{ mouseX }}>
            <div
                className={cn(
                    "dock mx-auto flex w-fit max-w-[calc(100vw-2rem)] items-center gap-2 overflow-visible rounded-[32px] border border-[var(--line)] bg-[var(--surface)] px-3 py-2 shadow-[var(--shadow)] backdrop-blur-xl transition-all duration-300",
                    mouseX !== null ? "px-4" : "",
                    className
                )}
                onMouseLeave={() => setMouseX(null)}
                onMouseMove={(event) => setMouseX(event.clientX)}
                {...props}
            />
        </DockContext.Provider>
    )
}

function DockItem({
    active,
    className,
    icon,
    label,
    style,
    ...props
}: React.ComponentProps<"div"> & {
    active?: boolean
    icon: React.ReactNode
    label: string
}) {
    const ref = useRef<HTMLDivElement>(null)
    const { mouseX } = useContext(DockContext)
    const influence = getInfluence(ref.current, mouseX)
    const translateY = -10 * influence
    const sideSpace = 7 * influence
    const highlightScale = 1 + 0.22 * influence
    const iconScale = 1 + 0.18 * influence
    const activeOrHovered = active || influence > 0.08

    return (
        <div
            aria-label={label}
            className={cn(
                "dock-item group relative grid size-11 shrink-0 cursor-pointer place-items-center rounded-2xl text-[var(--foreground)] transition-[margin,transform,background-color] duration-150 ease-out",
                className
            )}
            ref={ref}
            style={
                {
                    marginInline: `${sideSpace}px`,
                    transform: `translateY(${translateY}px)`,
                    ...style,
                } as CSSProperties
            }
            {...props}
        >
            <span className="absolute -top-9 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-[var(--foreground)] px-2.5 py-1 text-[11px] text-[var(--surface)] shadow-lg group-hover:block">
                {label}
                <span className="absolute left-1/2 top-full size-2 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-[var(--foreground)]" />
            </span>
            <span
                className={cn(
                    "absolute inset-0 rounded-2xl transition-transform duration-150 ease-out",
                    activeOrHovered ? "bg-[var(--accent-soft)]" : "bg-transparent"
                )}
                style={{ transform: `scale(${highlightScale})` }}
            />
            <span
                className="relative grid size-6 place-items-center transition-transform duration-150 ease-out"
                style={{ transform: `scale(${iconScale})` }}
            >
                {icon}
            </span>
        </div>
    )
}

function DockSeparator({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            className={cn("dock-separator mx-1 h-10 w-px shrink-0 bg-[var(--line)]", className)}
            {...props}
        />
    )
}

function getInfluence(element: HTMLDivElement | null, mouseX: number | null) {
    if (!element || mouseX === null) {
        return 0
    }

    const rect = element.getBoundingClientRect()
    const center = rect.left + rect.width / 2
    const distance = Math.abs(mouseX - center)
    const maxDistance = 128

    return Math.max(0, 1 - distance / maxDistance)
}

export { Dock, DockItem, DockSeparator }
