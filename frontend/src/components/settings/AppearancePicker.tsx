import { Check } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useWorkspaceStore } from "@/stores/workspace-store"
import { workspacePalettes } from "@/utils/config/palettes"

export function AppearancePicker() {
    const palette = useWorkspaceStore((state) => state.palette)
    const setPalette = useWorkspaceStore((state) => state.setPalette)

    return (
        <Card className="rounded-[28px]">
            <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>
                    Choose one palette. Each palette has separate colors for User and Author
                    workspaces.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-3 md:grid-cols-3">
                    {workspacePalettes.map((option) => {
                        const selected = palette === option.id

                        return (
                            <button
                                className={`rounded-[24px] border p-4 text-left transition ${
                                    selected
                                        ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                                        : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--accent)]"
                                }`}
                                key={option.id}
                                onClick={() => setPalette(option.id)}
                                type="button"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex -space-x-2">
                                        {option.swatches.map((color) => (
                                            <span
                                                className="size-8 rounded-full border-2 border-[var(--surface)] shadow-sm"
                                                key={color}
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </div>
                                    {selected ? (
                                        <span className="grid size-8 place-items-center rounded-full bg-[var(--accent)] text-[var(--accent-foreground)]">
                                            <Check className="size-4" />
                                        </span>
                                    ) : null}
                                </div>
                                <div className="mt-4 text-base font-medium text-[var(--foreground)]">
                                    {option.name}
                                </div>
                                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                                    {option.description}
                                </p>
                            </button>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
