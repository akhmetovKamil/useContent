import { Navigate, Outlet, useLocation } from "react-router-dom"

import { useMyAuthorProfileQuery } from "@/queries/profile"
import { useAuthStore } from "@/stores/auth-store"

export function RequireSession() {
    const token = useAuthStore((state) => state.token)
    const location = useLocation()

    if (!token) {
        return <Navigate replace state={{ from: location.pathname }} to="/" />
    }

    return <Outlet />
}

export function RequireAuthor() {
    const token = useAuthStore((state) => state.token)
    const authorQuery = useMyAuthorProfileQuery(Boolean(token))
    const location = useLocation()

    if (!token) {
        return <Navigate replace state={{ from: location.pathname }} to="/" />
    }

    if (authorQuery.isSuccess && !authorQuery.data) {
        return <Navigate replace to="/author/onboarding" />
    }

    if (authorQuery.isLoading) {
        return (
            <div className="rounded-[28px] border border-[var(--line)] bg-[var(--surface-strong)] p-6 text-[var(--muted)]">
                Loading author workspace...
            </div>
        )
    }

    return <Outlet />
}
