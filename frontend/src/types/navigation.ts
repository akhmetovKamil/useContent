import type { FeedSource } from "@shared/types/posts"
import type { LucideIcon } from "lucide-react"

export interface NavItemConfig {
    end?: boolean
    icon: LucideIcon
    label: string
    separatorAfter?: boolean
    to: string
}

export type ExploreFeedSource = Exclude<FeedSource, "author">

export type FeedSourceFilter = ExploreFeedSource | "all"

export interface FeedSourceFilterOption {
    id: FeedSourceFilter
    label: string
}

export type AuthorPostsTab = "published" | "drafts" | "archived" | "promoted"

export interface AuthorPostsTabOption {
    id: AuthorPostsTab
    label: string
}
