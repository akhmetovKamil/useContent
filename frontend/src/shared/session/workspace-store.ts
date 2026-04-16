import { create } from "zustand"
import { persist } from "zustand/middleware"

export type WorkspaceMode = "reader" | "author"

interface WorkspaceState {
    mode: WorkspaceMode
    setMode: (mode: WorkspaceMode) => void
    toggleMode: () => void
}

export const useWorkspaceStore = create<WorkspaceState>()(
    persist(
        (set, get) => ({
            mode: "reader",
            setMode: (mode) => set({ mode }),
            toggleMode: () => {
                set({ mode: get().mode === "reader" ? "author" : "reader" })
            },
        }),
        {
            name: "usecontent-workspace",
        }
    )
)
