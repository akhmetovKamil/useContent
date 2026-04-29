import type { PolicyMode } from "@shared/types/access"
import type { ContentStatus } from "@shared/types/posts"

export interface ManagedContentItem {
    id: string
    title: string
    status: ContentStatus
    policyMode: PolicyMode
    content?: string
    description?: string
    totalSize?: number
}

export interface SavedAccessPolicyOption {
    id: string
    isDefault: boolean
    name: string
}

export interface ContentCreateInput {
    accessPolicyId: string | null
    body: string
    policyMode: PolicyMode
    status: ContentStatus
    title: string
}

export type ContentManagerKind = "post" | "project"
