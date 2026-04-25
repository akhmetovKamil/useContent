import type { ActivityDto } from "@shared/types/content"
import { useInfiniteQuery } from "@tanstack/react-query"

import { activityApi } from "@/api/ActivityApi"
import { queryKeys } from "@/queries/queryKeys"

export function useMyActivityQuery(enabled = true) {
    return useInfiniteQuery({
        queryKey: queryKeys.myActivity,
        queryFn: ({ pageParam }) => activityApi.listMyActivity(pageParam),
        enabled,
        initialPageParam: null as string | null,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        refetchInterval: 30_000,
    })
}

export function flattenActivityPages(data?: { pages: Array<{ items: ActivityDto[] }> }) {
    return data?.pages.flatMap((page) => page.items) ?? []
}
