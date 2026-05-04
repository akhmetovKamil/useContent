import type { FeedPostDto, PostDto } from "@shared/types/posts"

import { getOrCreateBrowserId } from "@/utils/local-id"

export function toAuthorFeedPost(
    post: PostDto,
    authorDisplayName: string,
    authorSlug: string,
    authorAvatarFileId: string | null = null
): FeedPostDto {
    return {
        ...post,
        accessLabel:
            post.policyMode === "public"
                ? "Public"
                : post.policyMode === "custom"
                  ? "Custom tier"
                  : "Default tier",
        authorDisplayName,
        authorAvatarFileId,
        authorSlug,
        commentsPreview: [],
        feedReason: `From @${authorSlug}`,
        feedSource: "author",
        hasAccess: true,
    }
}

export function getPostViewerKey() {
    return getOrCreateBrowserId("usecontent.viewerKey")
}
