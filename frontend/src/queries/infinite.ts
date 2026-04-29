import type { PaginatedResponse } from "@shared/types/common"
import type { InfiniteData, UseInfiniteQueryResult } from "@tanstack/react-query"

export type InfiniteQueryWithItems<TItem, TError = Error> = UseInfiniteQueryResult<
    InfiniteData<PaginatedResponse<TItem>>,
    TError
> & {
    hasMore: boolean
    isLoadingMore: boolean
    items: TItem[]
    loadMore: () => void
}

export function withInfiniteItems<TItem, TError = Error>(
    query: UseInfiniteQueryResult<InfiniteData<PaginatedResponse<TItem>>, TError>
): InfiniteQueryWithItems<TItem, TError> {
    return {
        ...query,
        hasMore: Boolean(query.hasNextPage),
        isLoadingMore: query.isFetchingNextPage,
        items: flattenInfiniteItems(query.data),
        loadMore: () => {
            void query.fetchNextPage()
        },
    }
}

function flattenInfiniteItems<TItem>(data?: InfiniteData<PaginatedResponse<TItem>>) {
    return data?.pages.flatMap((page) => page.items) ?? []
}
