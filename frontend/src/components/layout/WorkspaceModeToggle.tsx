import { PenTool, UserRound } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler"
import { useMyAuthorProfileQuery } from "@/queries/profile"
import { useAuthStore } from "@/stores/auth-store"
import { useWorkspaceStore } from "@/stores/workspace-store"

export function WorkspaceModeToggle() {
    const navigate = useNavigate()
    const token = useAuthStore((state) => state.token)
    const mode = useWorkspaceStore((state) => state.mode)
    const setMode = useWorkspaceStore((state) => state.setMode)
    const authorQuery = useMyAuthorProfileQuery(Boolean(token))
    const isAuthor = Boolean(token) && mode === "author"
    const disabled = !token || authorQuery.isLoading

    return (
        <div
            className={`flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-2 py-2 shadow-[var(--shadow)] backdrop-blur-sm ${
                !token ? "opacity-60" : ""
            }`}
        >
            <span className="pl-2 text-xs uppercase tracking-[0.24em] text-[var(--muted)]">
                {isAuthor ? "Author" : "Reader"}
            </span>
            <AnimatedThemeToggler
                aria-label={isAuthor ? "Switch to reader mode" : "Switch to author mode"}
                checked={isAuthor}
                checkedIcon={<PenTool className="size-5 text-white" />}
                className="grid size-9 place-items-center rounded-full bg-[var(--accent)] text-white transition-transform hover:scale-105"
                disabled={disabled}
                onCheckedChange={(checked) => {
                    if (!token) {
                        setMode("reader")
                        navigate("/")
                        return
                    }

                    if (!checked) {
                        setMode("reader")
                        navigate("/")
                        return
                    }

                    setMode("author")
                    navigate(authorQuery.data ? "/author" : "/author/onboarding")
                }}
                uncheckedIcon={<UserRound className="size-5 text-white" />}
            />
        </div>
    )
}
