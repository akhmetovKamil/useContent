import { CONTENT_STATUS, POLICY_MODE } from "@shared/consts"
import type { PolicyMode } from "@shared/types/access"
import type { ContentStatus } from "@shared/types/posts"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Modal } from "@/components/ui/modal"
import { Eyebrow, PageSection } from "@/components/ui/page"
import { ErrorMessage, LoadingMessage } from "@/components/ui/query-state"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { formatFileSize } from "@/utils/format"

interface ManagedContentItem {
    id: string
    title: string
    status: ContentStatus
    policyMode: PolicyMode
    content?: string
    description?: string
    totalSize?: number
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
    hideCreate?: boolean
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
    onOpen?: (item: ManagedContentItem) => void
    onArchive?: (itemId: string) => Promise<unknown>
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
    hideCreate = false,
    loadError,
    loadingLabel,
    missingSessionLabel,
    onCreate,
    onDelete,
    onOpen,
    onArchive,
    onToggleStatus,
    title,
    token,
}: ContentManagerPageProps) {
    const [draftTitle, setDraftTitle] = useState("")
    const [body, setBody] = useState("")
    const [status, setStatus] = useState<ContentStatus>(CONTENT_STATUS.DRAFT)
    const [policyMode, setPolicyMode] = useState<PolicyMode>(POLICY_MODE.INHERITED)
    const [accessPolicyId, setAccessPolicyId] = useState("")
    const [deleteTarget, setDeleteTarget] = useState<ManagedContentItem | null>(null)
    const bodyLabel = kind === "post" ? "Content" : "Description"

    return (
        <PageSection>
            <Eyebrow>{kind === "post" ? "Post manager" : "Project manager"}</Eyebrow>
            <h2 className="mt-3 font-[var(--serif)] text-3xl text-[var(--foreground)]">{title}</h2>
            {!token ? (
                <p className="mt-3 text-[var(--muted)]">{missingSessionLabel}</p>
            ) : isError ? (
                <div className="mt-3">
                    <ErrorMessage>{`Failed to load data: ${loadError?.message}`}</ErrorMessage>
                </div>
            ) : (
                <div className="mt-6 grid gap-6">
                    {hideCreate ? null : (
                        <form
                            className="grid gap-4 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5"
                            onSubmit={(event) => {
                                event.preventDefault()
                                void onCreate({
                                    title: draftTitle,
                                    body,
                                    status,
                                    policyMode,
                                    accessPolicyId:
                                        policyMode === POLICY_MODE.CUSTOM ? accessPolicyId : null,
                                }).then(() => {
                                    setDraftTitle("")
                                    setBody("")
                                    setStatus(CONTENT_STATUS.DRAFT)
                                    setPolicyMode(POLICY_MODE.INHERITED)
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
                                        onValueChange={(value) => setStatus(value as ContentStatus)}
                                        value={status}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={CONTENT_STATUS.DRAFT}>
                                                draft
                                            </SelectItem>
                                            <SelectItem value={CONTENT_STATUS.PUBLISHED}>
                                                published
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </Label>

                                <Label>
                                    Access mode
                                    <Select
                                        onValueChange={(value) =>
                                            setPolicyMode(value as PolicyMode)
                                        }
                                        value={policyMode}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={POLICY_MODE.INHERITED}>
                                                inherited
                                            </SelectItem>
                                            <SelectItem value={POLICY_MODE.PUBLIC}>
                                                public
                                            </SelectItem>
                                            <SelectItem value={POLICY_MODE.CUSTOM}>
                                                custom
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </Label>
                            </div>

                            {policyMode === POLICY_MODE.CUSTOM ? (
                                <Label>
                                    Saved access policy
                                    <Select
                                        onValueChange={setAccessPolicyId}
                                        value={accessPolicyId}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select policy" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {accessPolicies.map((policy) => (
                                                <SelectItem key={policy.id} value={policy.id}>
                                                    {policy.name}
                                                    {policy.isDefault ? " (default)" : ""}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
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
                    )}

                    <div className="grid gap-4">
                        {isLoading ? <LoadingMessage>{loadingLabel}</LoadingMessage> : null}

                        {items?.length ? (
                            items.map((item) => (
                                <ContentCard
                                    item={item}
                                    key={item.id}
                                    kind={kind}
                                    onOpen={onOpen}
                                    onArchive={onArchive}
                                    onRequestDelete={setDeleteTarget}
                                    onToggleStatus={onToggleStatus}
                                />
                            ))
                        ) : !isLoading ? (
                            <EmptyState description={emptyLabel} title={`No ${kind}s yet`} />
                        ) : null}
                    </div>
                </div>
            )}
            <Modal
                description={
                    deleteTarget
                        ? `This will permanently delete "${deleteTarget.title}".`
                        : undefined
                }
                onOpenChange={(open) => {
                    if (!open) {
                        setDeleteTarget(null)
                    }
                }}
                open={Boolean(deleteTarget)}
                title={`Delete ${kind}?`}
            >
                <div className="flex justify-end gap-2">
                    <Button onClick={() => setDeleteTarget(null)} type="button" variant="outline">
                        Cancel
                    </Button>
                    <Button
                        onClick={() => {
                            if (!deleteTarget) {
                                return
                            }
                            void onDelete(deleteTarget.id).then(() => setDeleteTarget(null))
                        }}
                        type="button"
                        variant="destructive"
                    >
                        Delete
                    </Button>
                </div>
            </Modal>
        </PageSection>
    )
}

function ContentCard({
    item,
    kind,
    onOpen,
    onArchive,
    onRequestDelete,
    onToggleStatus,
}: {
    item: ManagedContentItem
    kind: "post" | "project"
    onOpen?: (item: ManagedContentItem) => void
    onArchive?: (itemId: string) => Promise<unknown>
    onRequestDelete: (item: ManagedContentItem) => void
    onToggleStatus: (itemId: string, status: ContentStatus) => Promise<unknown>
}) {
    const body =
        kind === "post" ? item.content : item.description || "Project description is still empty"

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-wrap items-center gap-3">
                    <CardTitle>{item.title}</CardTitle>
                    <Badge>{item.status}</Badge>
                    <Badge>{item.policyMode}</Badge>
                    {kind === "project" && typeof item.totalSize === "number" ? (
                        <Badge>{formatFileSize(item.totalSize)}</Badge>
                    ) : null}
                </div>
            </CardHeader>
            <CardContent>
                <p className="line-clamp-3 text-sm leading-6 text-[var(--muted)]">{body}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                    {onOpen ? (
                        <Button
                            className="rounded-full"
                            onClick={() => onOpen(item)}
                            size="sm"
                            type="button"
                            variant="outline"
                        >
                            Open files
                        </Button>
                    ) : null}
                    <Button
                        className="rounded-full"
                        disabled={item.status === CONTENT_STATUS.PUBLISHED}
                        onClick={() => void onToggleStatus(item.id, CONTENT_STATUS.PUBLISHED)}
                        size="sm"
                        type="button"
                        variant="outline"
                    >
                        Publish
                    </Button>
                    {onArchive ? (
                        <Button
                            className="rounded-full"
                            onClick={() => void onArchive(item.id)}
                            size="sm"
                            type="button"
                            variant="outline"
                        >
                            Archive
                        </Button>
                    ) : null}
                    <Button
                        className="rounded-full"
                        onClick={() => onRequestDelete(item)}
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
