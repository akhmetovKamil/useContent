import { CONTENT_STATUS } from "@shared/consts"
import type { PostDto } from "@shared/types/content"
import type { QueryClient } from "@tanstack/react-query"

import { invalidateMany } from "@/queries/invalidate"
import { queryKeys } from "@/queries/queryKeys"

type EntityWithId = {
    id: string
}

export function removeEntityById<TItem extends EntityWithId>(
    items: TItem[] | undefined,
    id: string
) {
    return (items ?? []).filter((item) => item.id !== id)
}

export function prependUniqueEntity<TItem extends EntityWithId>(
    items: TItem[] | undefined,
    item: TItem
) {
    return [item, ...removeEntityById(items, item.id)]
}

export function invalidatePostCollections(queryClient: QueryClient) {
    return invalidateMany(queryClient, [
        queryKeys.myPosts(),
        queryKeys.myPosts(CONTENT_STATUS.ARCHIVED),
        queryKeys.exploreFeedPostsRoot,
        queryKeys.myFeedPosts,
        queryKeys.authors(),
    ])
}

export function moveMyPostBetweenStatusLists(
    queryClient: QueryClient,
    post: PostDto,
    nextStatus: PostDto["status"]
) {
    const activeKey = queryKeys.myPosts()
    const archiveKey = queryKeys.myPosts(CONTENT_STATUS.ARCHIVED)
    const nextPost = { ...post, status: nextStatus }

    queryClient.setQueryData<PostDto[]>(activeKey, (posts) => removeEntityById(posts, post.id))
    queryClient.setQueryData<PostDto[]>(archiveKey, (posts) => removeEntityById(posts, post.id))

    if (nextStatus === CONTENT_STATUS.ARCHIVED) {
        queryClient.setQueryData<PostDto[]>(archiveKey, (posts) =>
            prependUniqueEntity(posts, nextPost)
        )
        return
    }

    queryClient.setQueryData<PostDto[]>(activeKey, (posts) => prependUniqueEntity(posts, nextPost))
}
