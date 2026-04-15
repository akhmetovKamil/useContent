import { useMyProjectsQuery } from "@/queries/projects"
import { useAuthStore } from "@/shared/session/auth-store"

export function MeProjectsPage() {
    const token = useAuthStore((state) => state.token)
    const projectsQuery = useMyProjectsQuery(Boolean(token))

    return (
        <section className="rounded-[28px] border border-[var(--line)] bg-[var(--surface-strong)] p-6 md:p-8">
            <div className="font-mono text-xs uppercase tracking-[0.35em] text-[var(--muted)]">
                Project manager
            </div>
            <h2 className="mt-3 font-[var(--serif)] text-3xl text-[var(--foreground)]">
                Structured project spaces with gated access
            </h2>
            {!token ? (
                <p className="mt-3 text-[var(--muted)]">
                    После входа здесь появится дерево проектов и файловая часть контент-платформы.
                </p>
            ) : projectsQuery.isLoading ? (
                <p className="mt-3 text-[var(--muted)]">Загружаем проекты...</p>
            ) : projectsQuery.isError ? (
                <p className="mt-3 text-rose-600">
                    Не удалось загрузить проекты: {projectsQuery.error.message}
                </p>
            ) : (
                <div className="mt-6 grid gap-4">
                    {projectsQuery.data?.length ? (
                        projectsQuery.data.map((project) => (
                            <article
                                className="rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-5"
                                key={project.id}
                            >
                                <div className="flex flex-wrap items-center gap-3">
                                    <h3 className="text-xl text-[var(--foreground)]">
                                        {project.title}
                                    </h3>
                                    <span className="rounded-full bg-[var(--surface-strong)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                                        {project.status}
                                    </span>
                                    <span className="rounded-full bg-[var(--surface-strong)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                                        {project.policyMode}
                                    </span>
                                </div>
                                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                                    {project.description || "Project description is still empty"}
                                </p>
                            </article>
                        ))
                    ) : (
                        <p className="text-[var(--muted)]">Проектов пока нет.</p>
                    )}
                </div>
            )}
        </section>
    )
}
