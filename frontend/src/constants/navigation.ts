import {
    Bell,
    FileText,
    FolderKanban,
    Home,
    Info,
    Landmark,
    LayoutDashboard,
    ReceiptText,
    Settings,
    ShieldCheck,
    UserRound,
    UsersRound,
} from "lucide-react"

import type { FeedSourceFilterOption, NavItemConfig } from "@/types/navigation"

export const publicNavItems: NavItemConfig[] = [{ to: "/", label: "Home", icon: Home, end: true }]

export const readerNavItems: NavItemConfig[] = [
    { to: "/", label: "Home", icon: Home, end: true, separatorAfter: true },
    { to: "/me/profile", label: "Profile", icon: UserRound },
    { to: "/me/subscriptions", label: "Subscriptions", icon: ReceiptText },
    { to: "/me/activity", label: "Activity", icon: Bell },
    { to: "/me/settings", label: "Settings", icon: Settings },
]

export const authorNavItems: NavItemConfig[] = [
    { to: "/author", label: "Workspace", icon: LayoutDashboard, end: true },
    { to: "/author/about", label: "About", icon: Info, separatorAfter: true },
    { to: "/me/author", label: "Settings", icon: Settings },
    { to: "/me/subscribers", label: "Subscribers", icon: UsersRound },
    { to: "/me/posts", label: "Posts", icon: FileText },
    { to: "/me/projects", label: "Projects", icon: FolderKanban },
    { to: "/me/access", label: "Access", icon: ShieldCheck },
    { to: "/me/activity", label: "Activity", icon: Bell },
    { to: "/me/platform-billing", label: "Billing", icon: Landmark },
]

export const feedSourceFilters: FeedSourceFilterOption[] = [
    { id: "all", label: "All" },
    { id: "public", label: "Public" },
    { id: "subscribed", label: "Subscribed" },
    { id: "promoted", label: "Promoted" },
]
