import type { LucideIcon } from "lucide-react"

export interface NavItemConfig {
    end?: boolean
    icon: LucideIcon
    label: string
    separatorAfter?: boolean
    to: string
}
