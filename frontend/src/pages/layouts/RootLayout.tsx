import { NavLink, Outlet } from "react-router-dom"

import { WorkspaceModeToggle } from "@/components/layout/WorkspaceModeToggle"
import { buttonVariants } from "@/components/ui/button"
import { WalletStatus } from "@/components/wallet/WalletStatus"
import { useAuthStore } from "@/stores/auth-store"
import { useWorkspaceStore } from "@/stores/workspace-store"
import { cn } from "@/utils/cn"

const publicNavItems = [{ to: "/", label: "Home", end: true }]

const readerNavItems = [
    { to: "/", label: "Home", end: true },
    { to: "/me", label: "Me" },
]

const authorNavItems = [
    { to: "/author", label: "Workspace", end: true },
    { to: "/author/about", label: "About" },
    { to: "/me/author", label: "Settings" },
    { to: "/me/posts", label: "Posts" },
    { to: "/me/projects", label: "Projects" },
    { to: "/me/subscription-plan", label: "Access" },
]

export function RootLayout() {
    const token = useAuthStore((state) => state.token)
    const mode = useWorkspaceStore((state) => state.mode)
    const visibleMode = token ? mode : "reader"
    const navItems =
        !token ? publicNavItems : visibleMode === "author" ? authorNavItems : readerNavItems
    const subtitle = visibleMode === "author" ? "Author Workspace" : "User Workspace"

    return (
        <div className="min-h-screen px-4 py-4 transition-colors duration-500 md:px-6 md:py-6">
            <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-7xl flex-col rounded-[32px] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow)] backdrop-blur-sm">
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
                        <WorkspaceModeToggle />
                        <WalletStatus />
                    </div>
                </header>

                <nav className="flex flex-wrap gap-2 border-b border-[var(--line)] px-5 py-4 md:px-8">
                    {navItems.map((item) => (
                        <NavItem end={item.end} key={item.to} label={item.label} to={item.to} />
                    ))}
                </nav>

                <main className="flex-1 px-5 py-6 md:px-8 md:py-8">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}

function NavItem({ end, label, to }: { end?: boolean; label: string; to: string }) {
    return (
        <NavLink
            className={({ isActive }) =>
                cn(
                    buttonVariants({
                        size: "sm",
                        variant: isActive ? "default" : "secondary",
                    }),
                    "rounded-full"
                )
            }
            end={end}
            to={to}
        >
            {label}
        </NavLink>
    )
}
