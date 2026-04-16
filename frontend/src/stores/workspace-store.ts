import { create } from "zustand"
import { persist } from "zustand/middleware"

export type WorkspaceMode = "reader" | "author"
export type WorkspacePalette = "pastel-calm" | "bright-product" | "dual-brand"

interface WorkspaceState {
    hasAuthorProfileHint: boolean
    mode: WorkspaceMode
    palette: WorkspacePalette
    setHasAuthorProfileHint: (hasAuthorProfileHint: boolean) => void
    setMode: (mode: WorkspaceMode) => void
    setPalette: (palette: WorkspacePalette) => void
    toggleMode: () => void
}

export const useWorkspaceStore = create<WorkspaceState>()(
    persist(
        (set, get) => ({
            hasAuthorProfileHint: false,
            mode: "reader",
            palette: "pastel-calm",
            setHasAuthorProfileHint: (hasAuthorProfileHint) => set({ hasAuthorProfileHint }),
            setMode: (mode) => set({ mode }),
            setPalette: (palette) => set({ palette }),
            toggleMode: () => {
                set({ mode: get().mode === "reader" ? "author" : "reader" })
            },
        }),
        {
            name: "usecontent-workspace",
        }
    )
)
