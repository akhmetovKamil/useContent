import { CONTENT_STATUS, POLICY_MODE } from "@shared/consts"
import type { PolicyMode } from "@shared/types/access"
import type { ContentStatus } from "@shared/types/posts"
import { useState } from "react"

import { ContentManagerForm } from "@/components/content-manager/ContentManagerForm"
import { ContentManagerList } from "@/components/content-manager/ContentManagerList"
import { DeleteContentModal } from "@/components/content-manager/DeleteContentModal"
import { Eyebrow, PageSection } from "@/components/ui/page"
import { ErrorMessage } from "@/components/ui/query-state"
import type {
    ContentCreateInput,
    ContentManagerKind,
    ManagedContentItem,
    SavedAccessPolicyOption,
} from "@/types/content-manager"

interface ContentManagerProps {
    accessPolicies?: SavedAccessPolicyOption[]
    createError?: Error | null
    createPending: boolean
    emptyLabel: string
    intro: string
    isError: boolean
    isLoading: boolean
    items?: ManagedContentItem[]
    kind: ContentManagerKind
    hideCreate?: boolean
    loadError?: Error | null
    loadingLabel: string
    missingSessionLabel: string
    onCreate: (input: ContentCreateInput) => Promise<unknown>
    onDelete: (itemId: string) => Promise<unknown>
    onOpen?: (item: ManagedContentItem) => void
    onArchive?: (itemId: string) => Promise<unknown>
    onToggleStatus: (itemId: string, status: ContentStatus) => Promise<unknown>
    title: string
    token: string | null
}

export function ContentManager({
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
}: ContentManagerProps) {
    const [draftTitle, setDraftTitle] = useState("")
    const [body, setBody] = useState("")
    const [status, setStatus] = useState<ContentStatus>(CONTENT_STATUS.DRAFT)
    const [policyMode, setPolicyMode] = useState<PolicyMode>(POLICY_MODE.INHERITED)
    const [accessPolicyId, setAccessPolicyId] = useState("")
    const [deleteTarget, setDeleteTarget] = useState<ManagedContentItem | null>(null)
    const bodyLabel = kind === "post" ? "Content" : "Description"

    function resetForm() {
        setDraftTitle("")
        setBody("")
        setStatus(CONTENT_STATUS.DRAFT)
        setPolicyMode(POLICY_MODE.INHERITED)
        setAccessPolicyId("")
    }

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
                        <ContentManagerForm
                            accessPolicies={accessPolicies}
                            accessPolicyId={accessPolicyId}
                            body={body}
                            bodyLabel={bodyLabel}
                            createError={createError}
                            createPending={createPending}
                            draftTitle={draftTitle}
                            intro={intro}
                            kind={kind}
                            onAccessPolicyIdChange={setAccessPolicyId}
                            onBodyChange={setBody}
                            onPolicyModeChange={setPolicyMode}
                            onStatusChange={setStatus}
                            onSubmit={onCreate}
                            onTitleChange={setDraftTitle}
                            policyMode={policyMode}
                            reset={resetForm}
                            status={status}
                        />
                    )}

                    <ContentManagerList
                        emptyLabel={emptyLabel}
                        isLoading={isLoading}
                        items={items}
                        kind={kind}
                        loadingLabel={loadingLabel}
                        onArchive={onArchive}
                        onOpen={onOpen}
                        onRequestDelete={setDeleteTarget}
                        onToggleStatus={onToggleStatus}
                    />
                </div>
            )}
            <DeleteContentModal
                deleteTarget={deleteTarget}
                kind={kind}
                onDelete={onDelete}
                onTargetChange={setDeleteTarget}
            />
        </PageSection>
    )
}
