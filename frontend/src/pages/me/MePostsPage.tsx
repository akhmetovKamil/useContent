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
    useCreateMyPostMutation,
    useDeleteMyPostMutation,
    useMyPostsQuery,
    useUpdateMyPostMutation,
} from "@/queries/posts"
import { AccessPolicyEditor } from "@/shared/access/AccessPolicyEditor"
import {
    buildContentPolicyInput,
    createDefaultPolicyBuilderState,
    summarizePolicyInput,
    type AccessPolicyBuilderState,
} from "@/shared/access/policy"
import { useAuthStore } from "@/shared/session/auth-store"

export function MePostsPage() {
    const token = useAuthStore((state) => state.token)
    const postsQuery = useMyPostsQuery(Boolean(token))
    const createPostMutation = useCreateMyPostMutation()
    const updatePostMutation = useUpdateMyPostMutation()
    const deletePostMutation = useDeleteMyPostMutation()
    const [title, setTitle] = useState("")
    const [content, setContent] = useState("")
    const [status, setStatus] = useState<"draft" | "published">("draft")
    const [policyMode, setPolicyMode] = useState<"public" | "inherited" | "custom">("inherited")
    const [policyBuilder, setPolicyBuilder] = useState<AccessPolicyBuilderState>(
        createDefaultPolicyBuilderState()
    )
    const [formError, setFormError] = useState<string | null>(null)

    return (
        <PageSection>
            <Eyebrow>Post manager</Eyebrow>
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
                        className="grid gap-4 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5"
                        onSubmit={(event) => {
                            event.preventDefault()
                            setFormError(null)

                            try {
                                const policyPayload = buildContentPolicyInput({
                                    policyMode,
                                    builder: policyBuilder,
                                })

                                void createPostMutation
                                    .mutateAsync({
                                        title,
                                        content,
                                        status,
                                        ...policyPayload,
                                    })
                                    .then(() => {
                                        setTitle("")
                                        setContent("")
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
                            <Eyebrow className="tracking-[0.3em]">create post</Eyebrow>
                            <p className="mt-2 text-sm text-[var(--muted)]">
                                Базовая форма для первого контентного сценария. Теперь custom access
                                rule собирается визуально, без raw JSON.
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
                            Content
                            <Textarea
                                className="min-h-36 rounded-2xl border border-[var(--line)] bg-transparent px-4 py-3 outline-none"
                                onChange={(event) => setContent(event.target.value)}
                                value={content}
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
                                    disabled={createPostMutation.isPending}
                                    onChange={setPolicyBuilder}
                                />
                                <p className="text-sm text-[var(--muted)]">
                                    Preview: {summarizePolicyInput(policyBuilder)}
                                </p>
                            </div>
                        ) : null}

                        {formError ? <p className="text-sm text-rose-600">{formError}</p> : null}
                        {createPostMutation.isError ? (
                            <p className="text-sm text-rose-600">
                                {createPostMutation.error.message}
                            </p>
                        ) : null}

                        <Button
                            className="w-fit rounded-full"
                            disabled={createPostMutation.isPending}
                            type="submit"
                        >
                            {createPostMutation.isPending ? "Saving..." : "Create post"}
                        </Button>
                    </form>

                    <div className="grid gap-4">
                        {postsQuery.isLoading ? (
                            <p className="text-[var(--muted)]">Загружаем посты...</p>
                        ) : null}

                        {postsQuery.data?.length ? (
                            postsQuery.data.map((post) => (
                                <Card key={post.id}>
                                    <CardHeader>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <CardTitle>{post.title}</CardTitle>
                                            <Badge>{post.status}</Badge>
                                            <Badge>{post.policyMode}</Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="line-clamp-3 text-sm leading-6 text-[var(--muted)]">
                                            {post.content}
                                        </p>
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            <Button
                                                className="rounded-full"
                                                disabled={updatePostMutation.isPending}
                                                onClick={() =>
                                                    void updatePostMutation.mutateAsync({
                                                        postId: post.id,
                                                        input: {
                                                            status:
                                                                post.status === "published"
                                                                    ? "draft"
                                                                    : "published",
                                                        },
                                                    })
                                                }
                                                size="sm"
                                                type="button"
                                                variant="outline"
                                            >
                                                {post.status === "published"
                                                    ? "Move to draft"
                                                    : "Publish"}
                                            </Button>
                                            <Button
                                                className="rounded-full"
                                                disabled={deletePostMutation.isPending}
                                                onClick={() => {
                                                    if (window.confirm("Delete this post?")) {
                                                        void deletePostMutation.mutateAsync(post.id)
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
                        ) : !postsQuery.isLoading ? (
                            <p className="text-[var(--muted)]">Постов пока нет.</p>
                        ) : null}
                    </div>
                </div>
            )}
        </PageSection>
    )
}
