import type { WorkspacePalette } from "@/stores/workspace-store"

export interface WorkspacePaletteOption {
    description: string
    id: WorkspacePalette
    name: string
    swatches: string[]
}

export const workspacePalettes: WorkspacePaletteOption[] = [
    {
        description: "Soft reader space and light blue-green author studio.",
        id: "pastel-calm",
        name: "Pastel Calm",
        swatches: ["#fff7ea", "#ef9f76", "#e9fbf5", "#2f9fd8"],
    },
    {
        description: "Clean product whites with energetic creator colors.",
        id: "bright-product",
        name: "Bright Product",
        swatches: ["#ffffff", "#ff5b35", "#f4fbff", "#00a7ff"],
    },
    {
        description: "Editorial rose for users and glassy teal-blue for authors.",
        id: "dual-brand",
        name: "Dual Brand",
        swatches: ["#fff3f0", "#c75f7a", "#effcff", "#139f9a"],
    },
]
