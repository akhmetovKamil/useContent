import { NavLink } from "react-router-dom"

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
                        icon={<Icon className="size-6" strokeWidth={2.2} />}
                        label={item.label}
                    />
                )}
            </NavLink>
            {item.separatorAfter ? <DockSeparator /> : null}
        </>
    )
}
