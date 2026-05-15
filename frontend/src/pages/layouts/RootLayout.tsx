import { useEffect } from "react"
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom"
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
    const navigate = useNavigate()
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
    const isAuthorOnboarding = location.pathname === "/author/onboarding"
    const showAuthenticatedChrome = Boolean(token) && !isAuthorOnboarding
    const showFloatingHeader = !isAuthorOnboarding

    useEffect(() => {
        document.documentElement.dataset.palette = palette
    }, [palette])

    useEffect(() => {
        document.documentElement.classList.toggle("dark", visibleMode === "author")
    }, [visibleMode])

    useEffect(() => {
        if (token && location.pathname === "/") {
            navigate("/me/discover", { replace: true })
        }
    }, [location.pathname, navigate, token])

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
        <div
            className="min-h-screen overflow-x-hidden px-4 py-4 transition-colors duration-500 md:px-6 md:py-6"
            data-testid="app-shell"
        >
            <div className="relative mx-auto flex min-h-[calc(100vh-2rem)] min-w-0 max-w-7xl flex-col rounded-[32px] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow)] backdrop-blur-sm">
                <main
                    className={cn(
                        "min-w-0 flex-1 px-5 py-6 md:px-8 md:py-8",
                        showFloatingHeader ? "pt-24 md:pt-28" : ""
                    )}
                >
                    <Outlet />
                </main>
            </div>
            {showFloatingHeader ? (
                <div className="pointer-events-none fixed inset-x-4 top-4 z-40">
                    {showAuthenticatedChrome ? (
                        <div className="pointer-events-auto absolute left-1/2 top-0 -translate-x-1/2">
                            <WorkspaceModeToggle />
                        </div>
                    ) : null}
                    <div className="pointer-events-auto ml-auto flex w-fit max-w-[calc(100vw-2rem)] justify-end">
                        <WalletStatus />
                    </div>
                </div>
            ) : null}
            {showAuthenticatedChrome ? (
                <nav className="fixed bottom-4 left-1/2 z-40 w-[min(calc(100vw-1rem),720px)] -translate-x-1/2 px-2">
                    <Dock
                        className="border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow)]"
                        iconMagnification={56}
                        iconSize={44}
                    >
                        {navItems.map((item) => (
                            <DockIcon
                                className={cn(
                                    "relative text-[var(--foreground)]",
                                    item.separatorAfter
                                        ? "after:pointer-events-none after:absolute after:-right-2 after:top-1/2 after:z-0 after:h-10 after:w-px after:-translate-y-1/2 after:bg-[var(--line)]"
                                        : ""
                                )}
                                key={item.to}
                            >
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Link
                                            aria-label={item.label}
                                            className="relative grid size-full place-items-center rounded-2xl text-[var(--foreground)] transition-colors duration-150 ease-out hover:bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)] hover:text-[var(--foreground)]"
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
                                        </Link>
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
