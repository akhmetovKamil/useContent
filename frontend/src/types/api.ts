import type { ContentStatus, FeedSource } from "@shared/types/content"

export interface CursorPageInput {
    cursor?: string | null
    limit?: number
}

export interface SearchAuthorsInput {
    q?: string
}

export interface ExploreFeedInput extends CursorPageInput {
    q?: string
    source?: FeedSource | "all"
}

export interface ListContentInput {
    status?: ContentStatus
}

export interface ProjectNodeListInput {
    parentId?: string | null
    projectId: string
}

export interface AuthorProjectNodeListInput extends ProjectNodeListInput {
    slug: string
}

export interface ProjectBundleInput {
    folderId?: string | null
    projectId: string
}

export interface AuthorProjectBundleInput extends ProjectBundleInput {
    slug: string
}

export interface FileUploadParams {
    name: string
    parentId?: string | null
}
