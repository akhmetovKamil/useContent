import { useNavigate } from "react-router-dom"

import { useWorkspaceStore } from "@/shared/session/workspace-store"


export function WorkspaceModeToggle() {
    const navigate = useNavigate()
    const mode = useWorkspaceStore((state) => state.mode)
    const setMode = useWorkspaceStore((state) => state.setMode)
    const nextMode = mode === "reader" ? "author" : "reader"

    return (
        <button
            aria-label={`Switch to ${nextMode} mode`}
            className="group relative h-11 w-[180px] overflow-hidden rounded-full border border-[var(--line)] bg-[var(--surface)] p-1 text-sm shadow-[var(--shadow)] transition-colors"
            onClick={() => {
                setMode(nextMode)
                navigate(nextMode === "author" ? "/author" : "/")
            }}
            type="button"
        >
            <span
                className={[
                    "absolute top-1 h-9 w-[84px] rounded-full transition-all duration-300",
                    mode === "reader" ? "left-1 bg-sky-600" : "left-[91px] bg-emerald-600",
                ].join(" ")}
            />
            <span className="relative grid h-full grid-cols-2 items-center">
                
                <span
                    className={[
                        "transition-colors",
                        mode === "reader" ? "text-white" : "text-[var(--muted)]",
                    ].join(" ")}
                >
                    Reader
                </span>
                <span
                    className={[
                        "transition-colors",
                        mode === "author" ? "text-white" : "text-[var(--muted)]",
                    ].join(" ")}
                >
                    Author
                </span>
            </span>
        </button>
    )
}
