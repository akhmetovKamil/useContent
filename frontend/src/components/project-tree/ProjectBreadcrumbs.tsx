import type { ProjectNodeDto } from "@shared/types/projects"

import { Button } from "@/components/ui/button"

export function ProjectBreadcrumbs({
    breadcrumbs,
    currentFolderId,
    onOpenFolder,
}: {
    breadcrumbs: ProjectNodeDto[]
    currentFolderId: string | null
    onOpenFolder: (folderId: string) => void
}) {
    return (
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-[var(--muted)]">
            {breadcrumbs.map((breadcrumb, index) => (
                <Button
                    className="h-8 rounded-full px-3"
                    key={breadcrumb.id}
                    onClick={() => onOpenFolder(breadcrumb.id)}
                    type="button"
                    variant={breadcrumb.id === currentFolderId ? "default" : "outline"}
                >
                    {index === 0 ? "Root" : breadcrumb.name}
                </Button>
            ))}
        </div>
    )
}
