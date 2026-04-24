import type { RefObject } from "react"
import { useEffect } from "react"

export function useInfiniteScrollSentinel({
    enabled,
    hasNextPage,
    isFetchingNextPage,
    onLoadMore,
    rootMargin = "500px",
    sentinelRef,
}: {
    enabled: boolean
    hasNextPage: boolean
    isFetchingNextPage: boolean
    onLoadMore: () => void
    rootMargin?: string
    sentinelRef: RefObject<HTMLElement | null>
}) {
    useEffect(() => {
        const element = sentinelRef.current
        if (!enabled || !element || !hasNextPage) {
            return
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry?.isIntersecting && !isFetchingNextPage) {
                    onLoadMore()
                }
            },
            { rootMargin },
        )

        observer.observe(element)
        return () => observer.disconnect()
    }, [enabled, hasNextPage, isFetchingNextPage, onLoadMore, rootMargin, sentinelRef])
}
