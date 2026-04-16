import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eyebrow, PageSection } from "@/components/ui/page"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
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
        <PageSection>
            <Eyebrow>Project manager</Eyebrow>
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
                        className="grid gap-4 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5"
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
                            <Eyebrow className="tracking-[0.3em]">create project</Eyebrow>
                            <p className="mt-2 text-sm text-[var(--muted)]">
                                Базовый контейнер проекта. Custom access policy теперь тоже
                                собирается через визуальный builder.
                            </p>
                        </div>

                        <Label>
                            Title
                            <Input
                                onChange={(event) => setTitle(event.target.value)}
                                value={title}
                            />
                        </Label>

                        <Label>
                            Description
                            <Textarea
                                className="min-h-32 rounded-2xl border border-[var(--line)] bg-transparent px-4 py-3 outline-none"
                                onChange={(event) => setDescription(event.target.value)}
                                value={description}
                            />
                        </Label>

                        <div className="grid gap-4 md:grid-cols-2">
                            <Label>
                                Status
                                <Select
                                    onChange={(event) =>
                                        setStatus(event.target.value as "draft" | "published")
                                    }
                                    value={status}
                                >
                                    <option value="draft">draft</option>
                                    <option value="published">published</option>
                                </Select>
                            </Label>

                            <Label>
                                Policy mode
                                <Select
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
                                </Select>
                            </Label>
                        </div>

                        {policyMode === "custom" ? (
                            <div className="grid gap-3">
                                <Eyebrow className="tracking-[0.3em]">custom access policy</Eyebrow>
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

                        <Button
                            className="w-fit rounded-full"
                            disabled={createProjectMutation.isPending}
                            type="submit"
                        >
                            {createProjectMutation.isPending ? "Saving..." : "Create project"}
                        </Button>
                    </form>

                    <div className="grid gap-4">
                        {projectsQuery.isLoading ? (
                            <p className="text-[var(--muted)]">Загружаем проекты...</p>
                        ) : null}

                        {projectsQuery.data?.length ? (
                            projectsQuery.data.map((project) => (
                                <Card key={project.id}>
                                    <CardHeader>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <CardTitle>{project.title}</CardTitle>
                                            <Badge>{project.status}</Badge>
                                            <Badge>{project.policyMode}</Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm leading-6 text-[var(--muted)]">
                                            {project.description ||
                                                "Project description is still empty"}
                                        </p>
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            <Button
                                                className="rounded-full"
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
                                                size="sm"
                                                type="button"
                                                variant="outline"
                                            >
                                                {project.status === "published"
                                                    ? "Move to draft"
                                                    : "Publish"}
                                            </Button>
                                            <Button
                                                className="rounded-full"
                                                disabled={deleteProjectMutation.isPending}
                                                onClick={() => {
                                                    if (window.confirm("Delete this project?")) {
                                                        void deleteProjectMutation.mutateAsync(
                                                            project.id
                                                        )
                                                    }
                                                }}
                                                size="sm"
                                                type="button"
                                                variant="destructive"
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : !projectsQuery.isLoading ? (
                            <p className="text-[var(--muted)]">Проектов пока нет.</p>
                        ) : null}
                    </div>
                </div>
            )}
        </PageSection>
    )
}
