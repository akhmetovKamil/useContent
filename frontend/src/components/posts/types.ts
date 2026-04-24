import type { FeedPostDto, PostDto } from "@shared/types/content"

export type FeedPost = PostDto | FeedPostDto

export interface AuthorPostActions {
    onArchive?: (post: PostDto) => void
    onDelete?: (post: PostDto) => void
    onEdit?: (post: PostDto) => void
    onPublish?: (post: PostDto) => void
    onUnarchive?: (post: PostDto) => void
}

export function getFeedAuthor(post: FeedPost) {
    return "authorSlug" in post ? post : null
}

export function getPostAccess(post: FeedPost) {
    return !("hasAccess" in post) || post.hasAccess
}
