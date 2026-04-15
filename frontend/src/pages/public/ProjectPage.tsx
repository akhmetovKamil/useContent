import { useParams } from "react-router-dom"

import { useAuthorProjectQuery } from "@/queries/projects"

export function ProjectPage() {
    const { slug, projectId } = useParams()
    const projectQuery = useAuthorProjectQuery(slug ?? "", projectId ?? "")

    return (
        <section className="rounded-[28px] border border-[var(--line)] bg-[var(--surface-strong)] p-6 md:p-8">
            <div className="font-mono text-xs uppercase tracking-[0.35em] text-[var(--muted)]">
                Project view
            </div>
            {projectQuery.isLoading ? (
                <p className="mt-3 text-[var(--muted)]">Загружаем проект...</p>
            ) : projectQuery.isError ? (
                <p className="mt-3 text-rose-600">
                    Не удалось открыть проект автора @{slug}: {projectQuery.error.message}
                </p>
            ) : projectQuery.data ? (
                <>
                    <h2 className="mt-3 font-[var(--serif)] text-3xl text-[var(--foreground)]">
                        {projectQuery.data.title}
                    </h2>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                        <span>{projectQuery.data.status}</span>
                        <span>{projectQuery.data.policyMode}</span>
                    </div>
                    <p className="mt-6 whitespace-pre-wrap text-base leading-7 text-[var(--foreground)]">
                        {projectQuery.data.description || "Project description is still empty."}
                    </p>
                </>
            ) : null}
        </section>
    )
}
