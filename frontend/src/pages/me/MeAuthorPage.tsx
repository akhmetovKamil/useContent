import { useState } from "react"

import { isApiNotFoundError } from "@/lib/api/errors"
import { useCreateMyAuthorProfileMutation, useMyAuthorProfileQuery } from "@/queries/profile"
import { useAuthStore } from "@/shared/session/auth-store"

export function MeAuthorPage() {
    const token = useAuthStore((state) => state.token)
    const authorQuery = useMyAuthorProfileQuery(Boolean(token))
    const createAuthorMutation = useCreateMyAuthorProfileMutation()
    const [slug, setSlug] = useState("")
    const [displayName, setDisplayName] = useState("")
    const [bio, setBio] = useState("")
    const showCreateForm = token && isApiNotFoundError(authorQuery.error)

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
                showCreateForm ? (
                    <form
                        className="mt-6 grid gap-4 rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-5"
                        onSubmit={(event) => {
                            event.preventDefault()
                            void createAuthorMutation.mutateAsync({
                                slug,
                                displayName,
                                bio,
                            })
                        }}
                    >
                        <div>
                            <div className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                                create author profile
                            </div>
                            <p className="mt-2 text-sm text-[var(--muted)]">
                                Сначала создаем публичный author profile. После этого появятся
                                посты, проекты и монетизация.
                            </p>
                        </div>

                        <label className="grid gap-2 text-sm text-[var(--foreground)]">
                            Slug
                            <input
                                className="rounded-2xl border border-[var(--line)] bg-transparent px-4 py-3 outline-none"
                                onChange={(event) => setSlug(event.target.value)}
                                placeholder="kamil"
                                value={slug}
                            />
                        </label>

                        <label className="grid gap-2 text-sm text-[var(--foreground)]">
                            Display name
                            <input
                                className="rounded-2xl border border-[var(--line)] bg-transparent px-4 py-3 outline-none"
                                onChange={(event) => setDisplayName(event.target.value)}
                                placeholder="Kamil Akhmetov"
                                value={displayName}
                            />
                        </label>

                        <label className="grid gap-2 text-sm text-[var(--foreground)]">
                            Bio
                            <textarea
                                className="min-h-28 rounded-2xl border border-[var(--line)] bg-transparent px-4 py-3 outline-none"
                                onChange={(event) => setBio(event.target.value)}
                                placeholder="Short author description"
                                value={bio}
                            />
                        </label>

                        {createAuthorMutation.isError ? (
                            <p className="text-sm text-rose-600">
                                {createAuthorMutation.error.message}
                            </p>
                        ) : null}

                        <button
                            className="w-fit rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent-foreground)] disabled:opacity-60"
                            disabled={createAuthorMutation.isPending}
                            type="submit"
                        >
                            {createAuthorMutation.isPending
                                ? "Creating..."
                                : "Create author profile"}
                        </button>
                    </form>
                ) : (
                    <p className="mt-3 text-rose-600">
                        Авторский профиль пока не найден или недоступен: {authorQuery.error.message}
                    </p>
                )
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
