import { useInfiniteQuery } from "@tanstack/react-query"

import { activityApi } from "@/api/ActivityApi"
import { withInfiniteItems } from "@/queries/infinite"
import { queryKeys } from "@/queries/queryKeys"

export function useMyActivityQuery(enabled = true) {
    const query = useInfiniteQuery({
        queryKey: queryKeys.myActivity,
        queryFn: ({ pageParam }) => activityApi.listMyActivity(pageParam),
        enabled,
        initialPageParam: null as string | null,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        refetchInterval: 30_000,
    })

    return withInfiniteItems(query)
}
