import { NavLink } from "react-router-dom"
import { LockKeyhole } from "lucide-react"

import { DockItem, DockSeparator } from "@/components/ui/dock"
import type { NavItemConfig } from "@/types/navigation"

export function NavItem({ item }: { item: NavItemConfig }) {
    const Icon = item.icon

    return (
        <>
            <NavLink end={item.end} to={item.to}>
                {({ isActive }) => (
                    <DockItem
                        active={isActive}
                        icon={
                            <span className="relative">
                                <Icon className="size-6" strokeWidth={2.2} />
                                {item.locked ? (
                                    <span className="absolute -right-2 -bottom-2 grid size-4 place-items-center rounded-full bg-[var(--foreground)] text-[var(--surface)]">
                                        <LockKeyhole className="size-2.5" strokeWidth={2.4} />
                                    </span>
                                ) : null}
                            </span>
                        }
                        label={item.label}
                    />
                )}
            </NavLink>
            {item.separatorAfter ? <DockSeparator /> : null}
        </>
    )
}
