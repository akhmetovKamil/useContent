import { useEffect } from "react"
import { NavLink, Outlet, useLocation } from "react-router-dom"
import { LockKeyhole } from "lucide-react"

import { WorkspaceModeToggle } from "@/components/layout/WorkspaceModeToggle"
import { Dock, DockIcon } from "@/components/ui/dock"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { WalletStatus } from "@/components/wallet/WalletStatus"
import { authorNavItems, publicNavItems, readerNavItems } from "@/constants/navigation"
import { useMyAuthorPlatformBillingQuery } from "@/queries/platform"
import { useMyAuthorProfileQuery } from "@/queries/profile"
import { useAuthStore } from "@/stores/auth-store"
import { useWorkspaceStore } from "@/stores/workspace-store"
import { cn } from "@/utils/cn"

export function RootLayout() {
    const location = useLocation()
    const token = useAuthStore((state) => state.token)
    const mode = useWorkspaceStore((state) => state.mode)
    const palette = useWorkspaceStore((state) => state.palette)
    const hasAuthorProfileHint = useWorkspaceStore((state) => state.hasAuthorProfileHint)
    const setHasAuthorProfileHint = useWorkspaceStore((state) => state.setHasAuthorProfileHint)
    const authorQuery = useMyAuthorProfileQuery(Boolean(token))
    const hasAuthorProfile = Boolean(authorQuery.data)
    const readerProfilePath = authorQuery.data ? `/authors/${authorQuery.data.slug}` : "/me/profile"
    const visibleMode = token && (hasAuthorProfile || hasAuthorProfileHint) ? mode : "reader"
    const billingQuery = useMyAuthorPlatformBillingQuery(
        Boolean(token && hasAuthorProfile && visibleMode === "author")
    )
    const projectsLocked =
        visibleMode === "author" &&
        billingQuery.isSuccess &&
        Boolean(
            !billingQuery.data.features.includes("projects") ||
                !billingQuery.data.isProjectCreationAllowed
        )
    const navItems = !token
        ? publicNavItems
        : visibleMode === "author"
          ? authorNavItems.map((item) =>
                item.to === "/me/projects" ? { ...item, locked: projectsLocked } : item
            )
          : readerNavItems.map((item) =>
                item.label === "Profile" ? { ...item, to: readerProfilePath } : item
            )
    const subtitle = visibleMode === "author" ? "Author Workspace" : "User Workspace"
    const isAuthorOnboarding = location.pathname === "/author/onboarding"
    const showDock = Boolean(token && !isAuthorOnboarding)
    const showWorkspaceToggle = Boolean(token && !isAuthorOnboarding)

    useEffect(() => {
        document.documentElement.dataset.palette = palette
    }, [palette])

    useEffect(() => {
        document.documentElement.classList.toggle("dark", visibleMode === "author")
    }, [visibleMode])

    useEffect(() => {
        if (hasAuthorProfile) {
            setHasAuthorProfileHint(true)
            return
        }

        if (authorQuery.isSuccess && !authorQuery.data) {
            setHasAuthorProfileHint(false)
        }
    }, [authorQuery.data, authorQuery.isSuccess, hasAuthorProfile, setHasAuthorProfileHint])

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
                <nav className="fixed bottom-4 left-1/2 z-40 w-[min(calc(100vw-1rem),720px)] -translate-x-1/2 px-2">
                    <Dock
                        className="mt-0 border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow)]"
                        iconMagnification={56}
                        iconSize={44}
                    >
                        {navItems.map((item) => (
                            <DockIcon
                                className={cn(
                                    "relative text-[var(--foreground)]",
                                    item.separatorAfter
                                        ? "after:pointer-events-none after:absolute after:-right-2 after:top-1/2 after:h-10 after:w-px after:-translate-y-1/2 after:bg-[var(--line)]"
                                        : ""
                                )}
                                key={item.to}
                            >
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <NavLink
                                            aria-label={item.label}
                                            className={({ isActive }) =>
                                                cn(
                                                    "relative grid size-full place-items-center rounded-2xl text-[var(--foreground)] transition-colors",
                                                    isActive ? "bg-[var(--accent-soft)]" : "hover:bg-[var(--accent-soft)]"
                                                )
                                            }
                                            end={item.end}
                                            to={item.to}
                                        >
                                            <span className="relative">
                                                <item.icon className="size-6" strokeWidth={2.2} />
                                                {item.locked ? (
                                                    <span className="absolute -right-2 -bottom-2 grid size-4 place-items-center rounded-full bg-[var(--foreground)] text-[var(--surface)]">
                                                        <LockKeyhole
                                                            className="size-2.5"
                                                            strokeWidth={2.4}
                                                        />
                                                    </span>
                                                ) : null}
                                            </span>
                                        </NavLink>
                                    </TooltipTrigger>
                                    <TooltipContent>{item.label}</TooltipContent>
                                </Tooltip>
                            </DockIcon>
                        ))}
                    </Dock>
                </nav>
            ) : null}
        </div>
    )
}
