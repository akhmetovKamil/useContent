import {
    FileText,
    FolderKanban,
    Home,
    Info,
    LayoutDashboard,
    Settings,
    ShieldCheck,
    UserRound,
    type LucideIcon,
} from "lucide-react"
import { useEffect } from "react"
import { NavLink, Outlet, useLocation } from "react-router-dom"

import { WorkspaceModeToggle } from "@/components/layout/WorkspaceModeToggle"
import { Dock, DockItem, DockSeparator } from "@/components/ui/dock"
import { WalletStatus } from "@/components/wallet/WalletStatus"
import { useMyAuthorProfileQuery } from "@/queries/profile"
import { useAuthStore } from "@/stores/auth-store"
import { useWorkspaceStore } from "@/stores/workspace-store"
import { isApiNotFoundError } from "@/utils/api/errors"

interface NavItemConfig {
    end?: boolean
    icon: LucideIcon
    label: string
    separatorAfter?: boolean
    to: string
}

const publicNavItems: NavItemConfig[] = [{ to: "/", label: "Home", icon: Home, end: true }]

const readerNavItems: NavItemConfig[] = [
    { to: "/", label: "Home", icon: Home, end: true, separatorAfter: true },
    { to: "/me", label: "Me", icon: UserRound },
]

const authorNavItems: NavItemConfig[] = [
    { to: "/author", label: "Workspace", icon: LayoutDashboard, end: true },
    { to: "/author/about", label: "About", icon: Info, separatorAfter: true },
    { to: "/me/author", label: "Settings", icon: Settings },
    { to: "/me/posts", label: "Posts", icon: FileText },
    { to: "/me/projects", label: "Projects", icon: FolderKanban },
    { to: "/me/subscription-plan", label: "Access", icon: ShieldCheck },
]

export function RootLayout() {
    const location = useLocation()
    const token = useAuthStore((state) => state.token)
    const mode = useWorkspaceStore((state) => state.mode)
    const palette = useWorkspaceStore((state) => state.palette)
    const authorQuery = useMyAuthorProfileQuery(Boolean(token))
    const hasAuthorProfile = Boolean(authorQuery.data)
    const authorMissing = isApiNotFoundError(authorQuery.error)
    const visibleMode = token ? mode : "reader"
    const navItems = !token
        ? publicNavItems
        : visibleMode === "author"
          ? authorNavItems
          : readerNavItems
    const subtitle = visibleMode === "author" ? "Author Workspace" : "User Workspace"
    const isAuthorOnboarding = location.pathname === "/author/onboarding"
    const showDock = Boolean(
        token &&
        !isAuthorOnboarding &&
        !authorMissing &&
        (hasAuthorProfile || (mode === "author" && authorQuery.isLoading))
    )
    const showWorkspaceToggle = Boolean(token && hasAuthorProfile && !isAuthorOnboarding)

    useEffect(() => {
        document.documentElement.dataset.palette = palette
    }, [palette])

    useEffect(() => {
        document.documentElement.classList.toggle("dark", visibleMode === "author")
    }, [visibleMode])

    return (
        <div className="min-h-screen px-4 py-4 transition-colors duration-500 md:px-6 md:py-6">
            <div className="relative mx-auto flex min-h-[calc(100vh-2rem)] max-w-7xl flex-col rounded-[32px] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow)] backdrop-blur-sm">
                <header className="flex flex-col gap-5 border-b border-[var(--line)] px-5 py-5 md:flex-row md:items-center md:justify-between md:px-8">
                    <div>
                        <div className="font-mono text-xs uppercase tracking-[0.35em] text-[var(--muted)]">
                            useContent
                        </div>
                        <div className="mt-2 max-w-xl font-[var(--serif)] text-2xl leading-tight text-[var(--foreground)] md:text-4xl">
                            {subtitle}
                        </div>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        {showWorkspaceToggle ? <WorkspaceModeToggle /> : null}
                        <WalletStatus />
                    </div>
                </header>

                <main className="flex-1 px-5 py-6 md:px-8 md:py-8">
                    <Outlet />
                </main>
            </div>
            {showDock ? (
                <nav className="fixed bottom-4 left-1/2 z-[100] w-[min(calc(100vw-1rem),720px)] -translate-x-1/2 px-2">
                    <Dock>
                        {navItems.map((item) => (
                            <NavItem item={item} key={item.to} />
                        ))}
                    </Dock>
                </nav>
            ) : null}
        </div>
    )
}

function NavItem({ item }: { item: NavItemConfig }) {
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
