import { useMyAuthorProfileQuery } from "@/queries/profile"
import { useAuthStore } from "@/shared/session/auth-store"

export function MeAuthorPage() {
    const token = useAuthStore((state) => state.token)
    const authorQuery = useMyAuthorProfileQuery(Boolean(token))

    return (
        <section className="rounded-[28px] border border-[var(--line)] bg-[var(--surface-strong)] p-6 md:p-8">
            <div className="font-mono text-xs uppercase tracking-[0.35em] text-[var(--muted)]">
                Author settings
            </div>
            <h2 className="mt-3 font-[var(--serif)] text-3xl text-[var(--foreground)]">
                Public author identity
            </h2>
            {!token ? (
                <p className="mt-3 text-[var(--muted)]">
                    После web3-входа здесь будет видно авторский профиль и дальше сюда добавим
                    редактирование slug, bio и дефолтной политики доступа.
                </p>
            ) : authorQuery.isLoading ? (
                <p className="mt-3 text-[var(--muted)]">Загружаем профиль автора...</p>
            ) : authorQuery.isError ? (
                <p className="mt-3 text-rose-600">
                    Авторский профиль пока не найден или недоступен: {authorQuery.error.message}
                </p>
            ) : authorQuery.data ? (
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <article className="rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-5">
                        <div className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                            slug
                        </div>
                        <div className="mt-3 text-2xl text-[var(--foreground)]">
                            @{authorQuery.data.slug}
                        </div>
                        <div className="mt-2 text-sm text-[var(--muted)]">
                            {authorQuery.data.displayName}
                        </div>
                    </article>

                    <article className="rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-5">
                        <div className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                            bio
                        </div>
                        <div className="mt-3 text-sm leading-6 text-[var(--foreground)]">
                            {authorQuery.data.bio || "Bio is still empty"}
                        </div>
                    </article>
                </div>
            ) : null}
        </section>
    )
}
