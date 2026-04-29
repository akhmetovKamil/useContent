import { CONTENT_STATUS } from "@shared/consts"

import type { AuthorPostsTabOption } from "@/types/navigation"

export const postTabs: AuthorPostsTabOption[] = [
    { id: CONTENT_STATUS.PUBLISHED, label: "Published" },
    { id: "drafts", label: "Drafts" },
    { id: CONTENT_STATUS.ARCHIVED, label: "Archived" },
    { id: "promoted", label: "Promoted" },
]

export const postEmptyLabels = {
    archived: "Archive is empty.",
    drafts: "No drafts yet.",
    promoted: "No promoted posts yet.",
    published: "No published posts yet.",
} as const
