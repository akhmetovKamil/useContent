import { useEffect, useState } from "react"

import { isApiNotFoundError } from "@/lib/api/errors"
import {
    useCreateMyAuthorProfileMutation,
    useMyAuthorProfileQuery,
    useUpdateMyAuthorProfileMutation,
} from "@/queries/profile"
import { AccessPolicyEditor } from "@/shared/access/AccessPolicyEditor"
import {
    buildPolicyInputFromBuilder,
    createDefaultPolicyBuilderState,
    parsePolicyToBuilder,
    summarizePolicyInput,
    type AccessPolicyBuilderState,
} from "@/shared/access/policy"
import { useAuthStore } from "@/shared/session/auth-store"

export function MeAuthorPage() {
    const token = useAuthStore((state) => state.token)
    const authorQuery = useMyAuthorProfileQuery(Boolean(token))
    const createAuthorMutation = useCreateMyAuthorProfileMutation()
    const updateAuthorMutation = useUpdateMyAuthorProfileMutation()
    const [slug, setSlug] = useState("")
    const [displayName, setDisplayName] = useState("")
    const [bio, setBio] = useState("")
    const [defaultPolicyBuilder, setDefaultPolicyBuilder] = useState<AccessPolicyBuilderState>(
        createDefaultPolicyBuilderState()
    )
    const [formError, setFormError] = useState<string | null>(null)
    const showCreateForm = token && isApiNotFoundError(authorQuery.error)

    useEffect(() => {
        if (!authorQuery.data) {
            return
        }

        setDisplayName(authorQuery.data.displayName)
        setBio(authorQuery.data.bio)
        setDefaultPolicyBuilder(parsePolicyToBuilder(authorQuery.data.defaultPolicy))
    }, [authorQuery.data])

    return (
        <section className="rounded-[28px] border border-[var(--line)] bg-[var(--surface-strong)] p-6 md:p-8">
            <div className="font-mono text-xs uppercase tracking-[0.35em] text-[var(--muted)]">
                Author settings
            </div>
            <h2 className="mt-3 font-[var(--serif)] text-3xl text-[var(--foreground)]">
                Author profile and publishing identity
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
                            setFormError(null)

                            try {
                                void createAuthorMutation.mutateAsync({
                                    slug,
                                    displayName,
                                    bio,
                                    defaultPolicyInput:
                                        buildPolicyInputFromBuilder(defaultPolicyBuilder),
                                })
                            } catch (error) {
                                setFormError(
                                    error instanceof Error
                                        ? error.message
                                        : "Failed to build policy"
                                )
                            }
                        }}
                    >
                        <div>
                            <div className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                                create author profile
                            </div>
                            <p className="mt-2 text-sm text-[var(--muted)]">
                                Your wallet already works as a reader account. This step adds an
                                author profile, public slug, and default access policy for content.
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

                        <div className="grid gap-3">
                            <div className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                                default access policy
                            </div>
                            <AccessPolicyEditor
                                builder={defaultPolicyBuilder}
                                disabled={createAuthorMutation.isPending}
                                onChange={setDefaultPolicyBuilder}
                            />
                            <p className="text-sm text-[var(--muted)]">
                                Preview: {summarizePolicyInput(defaultPolicyBuilder)}
                            </p>
                        </div>

                        {formError ? <p className="text-sm text-rose-600">{formError}</p> : null}
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
                <div className="mt-6 grid gap-6">
                    <div className="grid gap-4 md:grid-cols-3">
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

                        <article className="rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-5">
                            <div className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                                default policy
                            </div>
                            <div className="mt-3 text-sm leading-6 text-[var(--foreground)]">
                                {authorQuery.data.defaultPolicy.root.type}
                            </div>
                        </article>
                    </div>

                    <form
                        className="grid gap-4 rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-5"
                        onSubmit={(event) => {
                            event.preventDefault()
                            setFormError(null)

                            try {
                                void updateAuthorMutation.mutateAsync({
                                    displayName,
                                    bio,
                                    defaultPolicyInput:
                                        buildPolicyInputFromBuilder(defaultPolicyBuilder),
                                })
                            } catch (error) {
                                setFormError(
                                    error instanceof Error
                                        ? error.message
                                        : "Failed to build policy"
                                )
                            }
                        }}
                    >
                        <div>
                            <div className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                                edit author profile
                            </div>
                            <p className="mt-2 text-sm text-[var(--muted)]">
                                Тут редактируется публичная информация автора и default policy,
                                которая потом наследуется контентом в режиме `inherited`.
                            </p>
                        </div>

                        <label className="grid gap-2 text-sm text-[var(--foreground)]">
                            Display name
                            <input
                                className="rounded-2xl border border-[var(--line)] bg-transparent px-4 py-3 outline-none"
                                onChange={(event) => setDisplayName(event.target.value)}
                                value={displayName}
                            />
                        </label>

                        <label className="grid gap-2 text-sm text-[var(--foreground)]">
                            Bio
                            <textarea
                                className="min-h-28 rounded-2xl border border-[var(--line)] bg-transparent px-4 py-3 outline-none"
                                onChange={(event) => setBio(event.target.value)}
                                value={bio}
                            />
                        </label>

                        <div className="grid gap-3">
                            <div className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                                default access policy
                            </div>
                            <AccessPolicyEditor
                                builder={defaultPolicyBuilder}
                                disabled={updateAuthorMutation.isPending}
                                onChange={setDefaultPolicyBuilder}
                            />
                            <p className="text-sm text-[var(--muted)]">
                                Preview: {summarizePolicyInput(defaultPolicyBuilder)}
                            </p>
                        </div>

                        {formError ? <p className="text-sm text-rose-600">{formError}</p> : null}
                        {updateAuthorMutation.isError ? (
                            <p className="text-sm text-rose-600">
                                {updateAuthorMutation.error.message}
                            </p>
                        ) : null}

                        <button
                            className="w-fit rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent-foreground)] disabled:opacity-60"
                            disabled={updateAuthorMutation.isPending}
                            type="submit"
                        >
                            {updateAuthorMutation.isPending ? "Saving..." : "Save author settings"}
                        </button>
                    </form>
                </div>
            ) : null}
        </section>
    )
}
