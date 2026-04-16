import { useNavigate } from "react-router-dom"

import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler"
import { useWorkspaceStore } from "@/shared/session/workspace-store"

export function WorkspaceModeToggle() {
    const navigate = useNavigate()
    const mode = useWorkspaceStore((state) => state.mode)
    const setMode = useWorkspaceStore((state) => state.setMode)
    const isAuthor = mode === "author"

    return (
        <div className="flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-2 py-2 shadow-[var(--shadow)] backdrop-blur-sm">
            <span className="pl-2 text-xs uppercase tracking-[0.24em] text-[var(--muted)]">
                {isAuthor ? "Author" : "Reader"}
            </span>
            <AnimatedThemeToggler
                aria-label={isAuthor ? "Switch to reader mode" : "Switch to author mode"}
                checked={isAuthor}
                className="grid size-9 place-items-center rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] transition-transform hover:scale-105"
                onCheckedChange={(checked) => {
                    const nextMode = checked ? "author" : "reader"
                    setMode(nextMode)
                    navigate(nextMode === "author" ? "/author" : "/")
                }}
            />
        </div>
    )
}
