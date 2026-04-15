import { useState } from "react"

import { useCreateMyPostMutation, useMyPostsQuery } from "@/queries/posts"
import { buildPolicyInput } from "@/shared/access/policy"
import { useAuthStore } from "@/shared/session/auth-store"

export function MePostsPage() {
    const token = useAuthStore((state) => state.token)
    const postsQuery = useMyPostsQuery(Boolean(token))
    const createPostMutation = useCreateMyPostMutation()
    const [title, setTitle] = useState("")
    const [content, setContent] = useState("")
    const [status, setStatus] = useState<"draft" | "published">("draft")
    const [policyMode, setPolicyMode] = useState<"public" | "inherited" | "custom">("inherited")
    const [customPolicyText, setCustomPolicyText] = useState("")
    const [formError, setFormError] = useState<string | null>(null)

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
            ) : postsQuery.isError ? (
                <p className="mt-3 text-rose-600">
                    Не удалось загрузить посты: {postsQuery.error.message}
                </p>
            ) : (
                <div className="mt-6 grid gap-6">
                    <form
                        className="grid gap-4 rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-5"
                        onSubmit={(event) => {
                            event.preventDefault()
                            setFormError(null)

                            try {
                                const policyInput = buildPolicyInput({
                                    policyMode,
                                    customPolicyText,
                                })

                                void createPostMutation
                                    .mutateAsync({
                                        title,
                                        content,
                                        status,
                                        ...policyInput,
                                    })
                                    .then(() => {
                                        setTitle("")
                                        setContent("")
                                        setStatus("draft")
                                        setPolicyMode("inherited")
                                        setCustomPolicyText("")
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
                                create post
                            </div>
                            <p className="mt-2 text-sm text-[var(--muted)]">
                                Базовая форма для первого контентного сценария. Дальше добавим
                                редактор, медиа и вложения.
                            </p>
                        </div>

                        <label className="grid gap-2 text-sm text-[var(--foreground)]">
                            Title
                            <input
                                className="rounded-2xl border border-[var(--line)] bg-transparent px-4 py-3 outline-none"
                                onChange={(event) => setTitle(event.target.value)}
                                value={title}
                            />
                        </label>

                        <label className="grid gap-2 text-sm text-[var(--foreground)]">
                            Content
                            <textarea
                                className="min-h-36 rounded-2xl border border-[var(--line)] bg-transparent px-4 py-3 outline-none"
                                onChange={(event) => setContent(event.target.value)}
                                value={content}
                            />
                        </label>

                        <div className="grid gap-4 md:grid-cols-2">
                            <label className="grid gap-2 text-sm text-[var(--foreground)]">
                                Status
                                <select
                                    className="rounded-2xl border border-[var(--line)] bg-transparent px-4 py-3 outline-none"
                                    onChange={(event) =>
                                        setStatus(event.target.value as "draft" | "published")
                                    }
                                    value={status}
                                >
                                    <option value="draft">draft</option>
                                    <option value="published">published</option>
                                </select>
                            </label>

                            <label className="grid gap-2 text-sm text-[var(--foreground)]">
                                Policy mode
                                <select
                                    className="rounded-2xl border border-[var(--line)] bg-transparent px-4 py-3 outline-none"
                                    onChange={(event) =>
                                        setPolicyMode(
                                            event.target.value as "public" | "inherited" | "custom"
                                        )
                                    }
                                    value={policyMode}
                                >
                                    <option value="inherited">inherited</option>
                                    <option value="public">public</option>
                                    <option value="custom">custom</option>
                                </select>
                            </label>
                        </div>

                        {policyMode === "custom" ? (
                            <label className="grid gap-2 text-sm text-[var(--foreground)]">
                                Custom policy JSON
                                <textarea
                                    className="min-h-32 rounded-2xl border border-[var(--line)] bg-transparent px-4 py-3 font-mono text-sm outline-none"
                                    onChange={(event) => setCustomPolicyText(event.target.value)}
                                    placeholder='{"version":1,"root":{"type":"public"}}'
                                    value={customPolicyText}
                                />
                            </label>
                        ) : null}

                        {formError ? <p className="text-sm text-rose-600">{formError}</p> : null}
                        {createPostMutation.isError ? (
                            <p className="text-sm text-rose-600">
                                {createPostMutation.error.message}
                            </p>
                        ) : null}

                        <button
                            className="w-fit rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent-foreground)] disabled:opacity-60"
                            disabled={createPostMutation.isPending}
                            type="submit"
                        >
                            {createPostMutation.isPending ? "Saving..." : "Create post"}
                        </button>
                    </form>

                    <div className="grid gap-4">
                        {postsQuery.isLoading ? (
                            <p className="text-[var(--muted)]">Загружаем посты...</p>
                        ) : null}

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
                        ) : !postsQuery.isLoading ? (
                            <p className="text-[var(--muted)]">Постов пока нет.</p>
                        ) : null}
                    </div>
                </div>
            )}
        </section>
    )
}
