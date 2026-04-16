import type { PolicyMode } from "@contracts/types/access"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eyebrow, PageSection } from "@/components/ui/page"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

type ContentStatus = "draft" | "published"

interface ManagedContentItem {
    id: string
    title: string
    status: ContentStatus
    policyMode: PolicyMode
    content?: string
    description?: string
}

interface SavedAccessPolicyOption {
    id: string
    isDefault: boolean
    name: string
}

interface ContentManagerPageProps {
    accessPolicies?: SavedAccessPolicyOption[]
    createError?: Error | null
    createPending: boolean
    emptyLabel: string
    intro: string
    isError: boolean
    isLoading: boolean
    items?: ManagedContentItem[]
    kind: "post" | "project"
    loadError?: Error | null
    loadingLabel: string
    missingSessionLabel: string
    onCreate: (input: {
        accessPolicyId: string | null
        body: string
        policyMode: PolicyMode
        status: ContentStatus
        title: string
    }) => Promise<unknown>
    onDelete: (itemId: string) => Promise<unknown>
    onToggleStatus: (itemId: string, status: ContentStatus) => Promise<unknown>
    title: string
    token: string | null
}

export function ContentManagerPage({
    accessPolicies = [],
    createError,
    createPending,
    emptyLabel,
    intro,
    isError,
    isLoading,
    items,
    kind,
    loadError,
    loadingLabel,
    missingSessionLabel,
    onCreate,
    onDelete,
    onToggleStatus,
    title,
    token,
}: ContentManagerPageProps) {
    const [draftTitle, setDraftTitle] = useState("")
    const [body, setBody] = useState("")
    const [status, setStatus] = useState<ContentStatus>("draft")
    const [policyMode, setPolicyMode] = useState<PolicyMode>("inherited")
    const [accessPolicyId, setAccessPolicyId] = useState("")
    const bodyLabel = kind === "post" ? "Content" : "Description"

    return (
        <PageSection>
            <Eyebrow>{kind === "post" ? "Post manager" : "Project manager"}</Eyebrow>
            <h2 className="mt-3 font-[var(--serif)] text-3xl text-[var(--foreground)]">{title}</h2>
            {!token ? (
                <p className="mt-3 text-[var(--muted)]">{missingSessionLabel}</p>
            ) : isError ? (
                <p className="mt-3 text-rose-600">
                    Не удалось загрузить данные: {loadError?.message}
                </p>
            ) : (
                <div className="mt-6 grid gap-6">
                    <form
                        className="grid gap-4 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5"
                        onSubmit={(event) => {
                            event.preventDefault()
                            void onCreate({
                                title: draftTitle,
                                body,
                                status,
                                policyMode,
                                accessPolicyId: policyMode === "custom" ? accessPolicyId : null,
                            }).then(() => {
                                setDraftTitle("")
                                setBody("")
                                setStatus("draft")
                                setPolicyMode("inherited")
                                setAccessPolicyId("")
                            })
                        }}
                    >
                        <div>
                            <Eyebrow className="tracking-[0.3em]">create {kind}</Eyebrow>
                            <p className="mt-2 text-sm text-[var(--muted)]">{intro}</p>
                        </div>

                        <Label>
                            Title
                            <Input
                                onChange={(event) => setDraftTitle(event.target.value)}
                                value={draftTitle}
                            />
                        </Label>

                        <Label>
                            {bodyLabel}
                            <Textarea
                                className="min-h-36"
                                onChange={(event) => setBody(event.target.value)}
                                value={body}
                            />
                        </Label>

                        <div className="grid gap-4 md:grid-cols-2">
                            <Label>
                                Status
                                <Select
                                    onChange={(event) =>
                                        setStatus(event.target.value as ContentStatus)
                                    }
                                    value={status}
                                >
                                    <option value="draft">draft</option>
                                    <option value="published">published</option>
                                </Select>
                            </Label>

                            <Label>
                                Access mode
                                <Select
                                    onChange={(event) =>
                                        setPolicyMode(event.target.value as PolicyMode)
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
                            <Label>
                                Saved access policy
                                <Select
                                    onChange={(event) => setAccessPolicyId(event.target.value)}
                                    value={accessPolicyId}
                                >
                                    <option value="">Select policy</option>
                                    {accessPolicies.map((policy) => (
                                        <option key={policy.id} value={policy.id}>
                                            {policy.name}
                                            {policy.isDefault ? " (default)" : ""}
                                        </option>
                                    ))}
                                </Select>
                            </Label>
                        ) : null}

                        {createError ? (
                            <p className="text-sm text-rose-600">{createError.message}</p>
                        ) : null}

                        <Button
                            className="w-fit rounded-full"
                            disabled={createPending}
                            type="submit"
                        >
                            {createPending ? "Saving..." : `Create ${kind}`}
                        </Button>
                    </form>

                    <div className="grid gap-4">
                        {isLoading ? <p className="text-[var(--muted)]">{loadingLabel}</p> : null}

                        {items?.length ? (
                            items.map((item) => (
                                <ContentCard
                                    item={item}
                                    key={item.id}
                                    kind={kind}
                                    onDelete={onDelete}
                                    onToggleStatus={onToggleStatus}
                                />
                            ))
                        ) : !isLoading ? (
                            <p className="text-[var(--muted)]">{emptyLabel}</p>
                        ) : null}
                    </div>
                </div>
            )}
        </PageSection>
    )
}

function ContentCard({
    item,
    kind,
    onDelete,
    onToggleStatus,
}: {
    item: ManagedContentItem
    kind: "post" | "project"
    onDelete: (itemId: string) => Promise<unknown>
    onToggleStatus: (itemId: string, status: ContentStatus) => Promise<unknown>
}) {
    const nextStatus = item.status === "published" ? "draft" : "published"
    const body =
        kind === "post" ? item.content : item.description || "Project description is still empty"

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-wrap items-center gap-3">
                    <CardTitle>{item.title}</CardTitle>
                    <Badge>{item.status}</Badge>
                    <Badge>{item.policyMode}</Badge>
                </div>
            </CardHeader>
            <CardContent>
                <p className="line-clamp-3 text-sm leading-6 text-[var(--muted)]">{body}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                        className="rounded-full"
                        onClick={() => void onToggleStatus(item.id, nextStatus)}
                        size="sm"
                        type="button"
                        variant="outline"
                    >
                        {item.status === "published" ? "Move to draft" : "Publish"}
                    </Button>
                    <Button
                        className="rounded-full"
                        onClick={() => {
                            if (window.confirm(`Delete this ${kind}?`)) {
                                void onDelete(item.id)
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
    )
}
