import { useState } from "react"

import {
    useCreateMyProjectMutation,
    useDeleteMyProjectMutation,
    useMyProjectsQuery,
    useUpdateMyProjectMutation,
} from "@/queries/projects"
import { AccessPolicyEditor } from "@/shared/access/AccessPolicyEditor"
import {
    buildContentPolicyInput,
    createDefaultPolicyBuilderState,
    summarizePolicyInput,
    type AccessPolicyBuilderState,
} from "@/shared/access/policy"
import { useAuthStore } from "@/shared/session/auth-store"

export function MeProjectsPage() {
    const token = useAuthStore((state) => state.token)
    const projectsQuery = useMyProjectsQuery(Boolean(token))
    const createProjectMutation = useCreateMyProjectMutation()
    const updateProjectMutation = useUpdateMyProjectMutation()
    const deleteProjectMutation = useDeleteMyProjectMutation()
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [status, setStatus] = useState<"draft" | "published">("draft")
    const [policyMode, setPolicyMode] = useState<"public" | "inherited" | "custom">("inherited")
    const [policyBuilder, setPolicyBuilder] = useState<AccessPolicyBuilderState>(
        createDefaultPolicyBuilderState()
    )
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
                                const policyPayload = buildContentPolicyInput({
                                    policyMode,
                                    builder: policyBuilder,
                                })

                                void createProjectMutation
                                    .mutateAsync({
                                        title,
                                        description,
                                        status,
                                        ...policyPayload,
                                    })
                                    .then(() => {
                                        setTitle("")
                                        setDescription("")
                                        setStatus("draft")
                                        setPolicyMode("inherited")
                                        setPolicyBuilder(createDefaultPolicyBuilderState())
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
                                Базовый контейнер проекта. Custom access policy теперь тоже
                                собирается через визуальный builder.
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
                            <div className="grid gap-3">
                                <div className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                                    custom access policy
                                </div>
                                <AccessPolicyEditor
                                    builder={policyBuilder}
                                    disabled={createProjectMutation.isPending}
                                    onChange={setPolicyBuilder}
                                />
                                <p className="text-sm text-[var(--muted)]">
                                    Preview: {summarizePolicyInput(policyBuilder)}
                                </p>
                            </div>
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
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <button
                                            className="rounded-full border border-[var(--line)] px-3 py-2 text-sm text-[var(--foreground)] disabled:opacity-60"
                                            disabled={updateProjectMutation.isPending}
                                            onClick={() =>
                                                void updateProjectMutation.mutateAsync({
                                                    projectId: project.id,
                                                    input: {
                                                        status:
                                                            project.status === "published"
                                                                ? "draft"
                                                                : "published",
                                                    },
                                                })
                                            }
                                            type="button"
                                        >
                                            {project.status === "published"
                                                ? "Move to draft"
                                                : "Publish"}
                                        </button>
                                        <button
                                            className="rounded-full border border-rose-200 px-3 py-2 text-sm text-rose-600 disabled:opacity-60"
                                            disabled={deleteProjectMutation.isPending}
                                            onClick={() => {
                                                if (window.confirm("Delete this project?")) {
                                                    void deleteProjectMutation.mutateAsync(
                                                        project.id
                                                    )
                                                }
                                            }}
                                            type="button"
                                        >
                                            Delete
                                        </button>
                                    </div>
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
