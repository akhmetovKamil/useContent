import { CONTENT_STATUS, POLICY_MODE } from "@shared/consts"
import type { PolicyMode } from "@shared/types/access"
import type { ContentStatus } from "@shared/types/posts"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eyebrow } from "@/components/ui/page"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type {
    ContentCreateInput,
    ContentManagerKind,
    SavedAccessPolicyOption,
} from "@/types/content-manager"

interface ContentManagerFormProps {
    accessPolicies: SavedAccessPolicyOption[]
    accessPolicyId: string
    body: string
    bodyLabel: string
    createError?: Error | null
    createPending: boolean
    draftTitle: string
    intro: string
    kind: ContentManagerKind
    onAccessPolicyIdChange: (value: string) => void
    onBodyChange: (value: string) => void
    onPolicyModeChange: (value: PolicyMode) => void
    onStatusChange: (value: ContentStatus) => void
    onSubmit: (input: ContentCreateInput) => Promise<unknown>
    onTitleChange: (value: string) => void
    policyMode: PolicyMode
    reset: () => void
    status: ContentStatus
}

export function ContentManagerForm({
    accessPolicies,
    accessPolicyId,
    body,
    bodyLabel,
    createError,
    createPending,
    draftTitle,
    intro,
    kind,
    onAccessPolicyIdChange,
    onBodyChange,
    onPolicyModeChange,
    onStatusChange,
    onSubmit,
    onTitleChange,
    policyMode,
    reset,
    status,
}: ContentManagerFormProps) {
    return (
        <form
            className="grid gap-4 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5"
            onSubmit={(event) => {
                event.preventDefault()
                void onSubmit({
                    title: draftTitle,
                    body,
                    status,
                    policyMode,
                    accessPolicyId: policyMode === POLICY_MODE.CUSTOM ? accessPolicyId : null,
                }).then(reset)
            }}
        >
            <div>
                <Eyebrow className="tracking-[0.3em]">create {kind}</Eyebrow>
                <p className="mt-2 text-sm text-[var(--muted)]">{intro}</p>
            </div>

            <Label>
                Title
                <Input onChange={(event) => onTitleChange(event.target.value)} value={draftTitle} />
            </Label>

            <Label>
                {bodyLabel}
                <Textarea
                    className="min-h-36"
                    onChange={(event) => onBodyChange(event.target.value)}
                    value={body}
                />
            </Label>

            <div className="grid gap-4 md:grid-cols-2">
                <Label>
                    Status
                    <Select
                        onValueChange={(value) => onStatusChange(value as ContentStatus)}
                        value={status}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={CONTENT_STATUS.DRAFT}>draft</SelectItem>
                            <SelectItem value={CONTENT_STATUS.PUBLISHED}>published</SelectItem>
                        </SelectContent>
                    </Select>
                </Label>

                <Label>
                    Access mode
                    <Select
                        onValueChange={(value) => onPolicyModeChange(value as PolicyMode)}
                        value={policyMode}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={POLICY_MODE.INHERITED}>inherited</SelectItem>
                            <SelectItem value={POLICY_MODE.PUBLIC}>public</SelectItem>
                            <SelectItem value={POLICY_MODE.CUSTOM}>custom</SelectItem>
                        </SelectContent>
                    </Select>
                </Label>
            </div>

            {policyMode === POLICY_MODE.CUSTOM ? (
                <Label>
                    Saved access policy
                    <Select onValueChange={onAccessPolicyIdChange} value={accessPolicyId}>
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

            {createError ? <p className="text-sm text-rose-600">{createError.message}</p> : null}

            <Button className="w-fit rounded-full" disabled={createPending} type="submit">
                {createPending ? "Saving..." : `Create ${kind}`}
            </Button>
        </form>
    )
}
