import { useQuery } from "@tanstack/react-query"

import { authorsApi } from "@/api/AuthorsApi"
import { postsApi } from "@/api/PostsApi"
import { queryKeys } from "./queryKeys"

export function useMyPostsQuery(enabled = true) {
    return useQuery({
        queryKey: queryKeys.myPosts,
        queryFn: () => postsApi.listMyPosts(),
        enabled,
    })
}

export function useAuthorPostsQuery(slug: string) {
    return useQuery({
        queryKey: queryKeys.authorPosts(slug),
        queryFn: () => authorsApi.listAuthorPosts(slug),
        enabled: Boolean(slug),
    })
}
