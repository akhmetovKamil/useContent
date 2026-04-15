import { useMyPostsQuery } from "@/queries/posts"
import { useAuthStore } from "@/shared/session/auth-store"

export function MePostsPage() {
    const token = useAuthStore((state) => state.token)
    const postsQuery = useMyPostsQuery(Boolean(token))

    return (
        <section className="rounded-[28px] border border-[var(--line)] bg-[var(--surface-strong)] p-6 md:p-8">
            <div className="font-mono text-xs uppercase tracking-[0.35em] text-[var(--muted)]">
                Post manager
            </div>
            <h2 className="mt-3 font-[var(--serif)] text-3xl text-[var(--foreground)]">
                Drafts, published posts, and access rules
            </h2>
            {!token ? (
                <p className="mt-3 text-[var(--muted)]">
                    После входа здесь будут посты автора и следующие шаги для создания редактора.
                </p>
            ) : postsQuery.isLoading ? (
                <p className="mt-3 text-[var(--muted)]">Загружаем посты...</p>
            ) : postsQuery.isError ? (
                <p className="mt-3 text-rose-600">
                    Не удалось загрузить посты: {postsQuery.error.message}
                </p>
            ) : (
                <div className="mt-6 grid gap-4">
                    {postsQuery.data?.length ? (
                        postsQuery.data.map((post) => (
                            <article
                                className="rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-5"
                                key={post.id}
                            >
                                <div className="flex flex-wrap items-center gap-3">
                                    <h3 className="text-xl text-[var(--foreground)]">
                                        {post.title}
                                    </h3>
                                    <span className="rounded-full bg-[var(--surface-strong)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                                        {post.status}
                                    </span>
                                    <span className="rounded-full bg-[var(--surface-strong)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                                        {post.policyMode}
                                    </span>
                                </div>
                                <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--muted)]">
                                    {post.content}
                                </p>
                            </article>
                        ))
                    ) : (
                        <p className="text-[var(--muted)]">Постов пока нет.</p>
                    )}
                </div>
            )}
        </section>
    )
}
