import { useState } from "react"

import { useCreateMyProjectMutation, useMyProjectsQuery } from "@/queries/projects"
import { buildPolicyInput } from "@/shared/access/policy"
import { useAuthStore } from "@/shared/session/auth-store"

export function MeProjectsPage() {
    const token = useAuthStore((state) => state.token)
    const projectsQuery = useMyProjectsQuery(Boolean(token))
    const createProjectMutation = useCreateMyProjectMutation()
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [status, setStatus] = useState<"draft" | "published">("draft")
    const [policyMode, setPolicyMode] = useState<"public" | "inherited" | "custom">("inherited")
    const [customPolicyText, setCustomPolicyText] = useState("")
    const [formError, setFormError] = useState<string | null>(null)

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
            ) : projectsQuery.isError ? (
                <p className="mt-3 text-rose-600">
                    Не удалось загрузить проекты: {projectsQuery.error.message}
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

                                void createProjectMutation
                                    .mutateAsync({
                                        title,
                                        description,
                                        status,
                                        ...policyInput,
                                    })
                                    .then(() => {
                                        setTitle("")
                                        setDescription("")
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
                                create project
                            </div>
                            <p className="mt-2 text-sm text-[var(--muted)]">
                                Базовый контейнер проекта. Следующим шагом сюда подключим дерево
                                папок, файлы и публикацию изменений.
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
                            Description
                            <textarea
                                className="min-h-32 rounded-2xl border border-[var(--line)] bg-transparent px-4 py-3 outline-none"
                                onChange={(event) => setDescription(event.target.value)}
                                value={description}
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
                        {createProjectMutation.isError ? (
                            <p className="text-sm text-rose-600">
                                {createProjectMutation.error.message}
                            </p>
                        ) : null}

                        <button
                            className="w-fit rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent-foreground)] disabled:opacity-60"
                            disabled={createProjectMutation.isPending}
                            type="submit"
                        >
                            {createProjectMutation.isPending ? "Saving..." : "Create project"}
                        </button>
                    </form>

                    <div className="grid gap-4">
                        {projectsQuery.isLoading ? (
                            <p className="text-[var(--muted)]">Загружаем проекты...</p>
                        ) : null}

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
                                        {project.description ||
                                            "Project description is still empty"}
                                    </p>
                                </article>
                            ))
                        ) : !projectsQuery.isLoading ? (
                            <p className="text-[var(--muted)]">Проектов пока нет.</p>
                        ) : null}
                    </div>
                </div>
            )}
        </section>
    )
}
