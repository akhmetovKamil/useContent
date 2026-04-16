import { create } from "zustand"
import { persist } from "zustand/middleware"

export type WorkspaceMode = "reader" | "author"
export type WorkspacePalette = "pastel-calm" | "bright-product" | "dual-brand"

interface WorkspaceState {
    mode: WorkspaceMode
    palette: WorkspacePalette
    setMode: (mode: WorkspaceMode) => void
    setPalette: (palette: WorkspacePalette) => void
    toggleMode: () => void
}

export const useWorkspaceStore = create<WorkspaceState>()(
    persist(
        (set, get) => ({
            mode: "reader",
            palette: "pastel-calm",
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
