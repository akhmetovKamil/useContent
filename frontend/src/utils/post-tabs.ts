import { CONTENT_STATUS } from "@shared/consts"

import type { AuthorPostsTab } from "@/types/navigation"

export interface PostTabCounts {
    archivedCount: number
    draftCount: number
    promotedCount: number
    publishedCount: number
}

export function getPostTabCount(tab: AuthorPostsTab, counts: PostTabCounts) {
    if (tab === CONTENT_STATUS.PUBLISHED) {
        return counts.publishedCount
    }
    if (tab === "drafts") {
        return counts.draftCount
    }
    if (tab === "promoted") {
        return counts.promotedCount
    }
    return counts.archivedCount
}
