import { NavLink, Outlet } from "react-router-dom"

import { WalletStatus } from "../../shared/wallet/WalletStatus"

const navItems = [
    { to: "/", label: "Home", end: true },
    { to: "/me", label: "Me" },
    { to: "/me/author", label: "Author" },
    { to: "/me/posts", label: "Posts" },
    { to: "/me/projects", label: "Projects" },
    { to: "/me/subscription-plan", label: "Plan" },
]

export function RootLayout() {
    return (
        <div className="min-h-screen px-4 py-4 md:px-6 md:py-6">
            <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-7xl flex-col rounded-[32px] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow)] backdrop-blur-sm">
                <header className="flex flex-col gap-5 border-b border-[var(--line)] px-5 py-5 md:flex-row md:items-center md:justify-between md:px-8">
                    <div>
                        <div className="font-mono text-xs uppercase tracking-[0.35em] text-[var(--muted)]">
                            useContent
                        </div>
                        <div className="mt-2 max-w-xl font-[var(--serif)] text-2xl leading-tight text-[var(--foreground)] md:text-4xl">
                            Web3 content platform for gated posts, projects, and author
                            subscriptions.
                        </div>
                    </div>
                    <WalletStatus />
                </header>

                <nav className="flex flex-wrap gap-2 border-b border-[var(--line)] px-5 py-4 md:px-8">
                    {navItems.map((item) => (
                        <NavLink
                            className={({ isActive }) =>
                                [
                                    "rounded-full px-4 py-2 text-sm transition-colors",
                                    isActive
                                        ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                                        : "bg-[var(--accent-soft)] text-[var(--foreground)]",
                                ].join(" ")
                            }
                            end={item.end}
                            key={item.to}
                            to={item.to}
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <main className="flex-1 px-5 py-6 md:px-8 md:py-8">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
