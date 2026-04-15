import { useParams } from "react-router-dom"

import { useAuthorProfileQuery } from "@/queries/authors"
import { useAuthorPostsQuery } from "@/queries/posts"
import { useAuthorProjectsQuery } from "@/queries/projects"
import { useAuthorSubscriptionPlanQuery } from "@/queries/subscription-plans"

export function AuthorPage() {
    const { slug } = useParams()
    const authorSlug = slug ?? ""
    const authorQuery = useAuthorProfileQuery(authorSlug)
    const postsQuery = useAuthorPostsQuery(authorSlug)
    const projectsQuery = useAuthorProjectsQuery(authorSlug)
    const planQuery = useAuthorSubscriptionPlanQuery(authorSlug)

    return (
        <section className="rounded-[28px] border border-[var(--line)] bg-[var(--surface-strong)] p-6 md:p-8">
            <div className="font-mono text-xs uppercase tracking-[0.35em] text-[var(--muted)]">
                Author page
            </div>
            <h2 className="mt-3 font-[var(--serif)] text-3xl text-[var(--foreground)]">@{slug}</h2>

            {authorQuery.isLoading ? (
                <p className="mt-3 max-w-2xl text-[var(--muted)]">Загружаем публичный профиль...</p>
            ) : authorQuery.isError ? (
                <p className="mt-3 max-w-2xl text-rose-600">
                    Профиль автора не найден: {authorQuery.error.message}
                </p>
            ) : authorQuery.data ? (
                <>
                    <p className="mt-3 max-w-2xl text-[var(--muted)]">
                        {authorQuery.data.bio || "Автор пока не добавил описание профиля."}
                    </p>

                    <div className="mt-6 grid gap-4 md:grid-cols-3">
                        <article className="rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-5">
                            <div className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                                author
                            </div>
                            <div className="mt-3 text-xl text-[var(--foreground)]">
                                {authorQuery.data.displayName}
                            </div>
                            <div className="mt-2 text-sm text-[var(--muted)]">
                                slug: @{authorQuery.data.slug}
                            </div>
                        </article>

                        <article className="rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-5">
                            <div className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                                content
                            </div>
                            <div className="mt-3 text-sm text-[var(--muted)]">
                                Posts: {postsQuery.data?.length ?? 0}
                            </div>
                            <div className="mt-2 text-sm text-[var(--muted)]">
                                Projects: {projectsQuery.data?.length ?? 0}
                            </div>
                        </article>

                        <article className="rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-5">
                            <div className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                                subscription
                            </div>
                            <div className="mt-3 text-sm text-[var(--foreground)]">
                                {planQuery.data
                                    ? `${planQuery.data.price} every ${planQuery.data.billingPeriodDays} days`
                                    : "No active plan yet"}
                            </div>
                        </article>
                    </div>

                    <div className="mt-8 grid gap-6 lg:grid-cols-2">
                        <div className="rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-5">
                            <div className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                                published posts
                            </div>
                            <div className="mt-4 grid gap-3">
                                {postsQuery.data?.length ? (
                                    postsQuery.data.map((post) => (
                                        <article
                                            className="rounded-[20px] border border-[var(--line)] bg-[var(--surface-strong)] p-4"
                                            key={post.id}
                                        >
                                            <div className="text-lg text-[var(--foreground)]">
                                                {post.title}
                                            </div>
                                            <div className="mt-2 text-sm text-[var(--muted)]">
                                                {post.content.slice(0, 180)}
                                            </div>
                                        </article>
                                    ))
                                ) : (
                                    <p className="text-sm text-[var(--muted)]">Постов пока нет.</p>
                                )}
                            </div>
                        </div>

                        <div className="rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-5">
                            <div className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                                published projects
                            </div>
                            <div className="mt-4 grid gap-3">
                                {projectsQuery.data?.length ? (
                                    projectsQuery.data.map((project) => (
                                        <article
                                            className="rounded-[20px] border border-[var(--line)] bg-[var(--surface-strong)] p-4"
                                            key={project.id}
                                        >
                                            <div className="text-lg text-[var(--foreground)]">
                                                {project.title}
                                            </div>
                                            <div className="mt-2 text-sm text-[var(--muted)]">
                                                {project.description || "No description yet"}
                                            </div>
                                        </article>
                                    ))
                                ) : (
                                    <p className="text-sm text-[var(--muted)]">
                                        Опубликованных проектов пока нет.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            ) : null}
        </section>
    )
}
