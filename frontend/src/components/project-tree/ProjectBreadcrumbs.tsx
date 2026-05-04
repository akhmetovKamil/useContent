import type { ProjectNodeDto } from "@shared/types/projects"

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
        <nav
            aria-label="Project path"
            className="mb-4 flex min-w-0 flex-wrap items-center gap-1 rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3 font-mono text-sm text-[var(--muted)]"
        >
            {breadcrumbs.map((breadcrumb, index) => (
                <span className="flex min-w-0 items-center" key={breadcrumb.id}>
                    <button
                        className={
                            breadcrumb.id === currentFolderId
                                ? "max-w-[14rem] truncate text-[var(--foreground)] underline decoration-[var(--accent)] decoration-2 underline-offset-4"
                                : "max-w-[14rem] truncate transition hover:text-[var(--foreground)]"
                        }
                        onClick={() => onOpenFolder(breadcrumb.id)}
                        type="button"
                    >
                        {index === 0 ? "root" : breadcrumb.name}
                    </button>
                    <span className="mx-1 text-[var(--muted)]">/</span>
                </span>
            ))}
        </nav>
    )
}
