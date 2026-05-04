import { Button } from "@/components/ui/button"

interface LoadMorePostsButtonProps {
    hasMore: boolean
    isLoadingMore: boolean
    onLoadMore: () => void
}

export function LoadMorePostsButton({
    hasMore,
    isLoadingMore,
    onLoadMore,
}: LoadMorePostsButtonProps) {
    if (!hasMore) {
        return null
    }

    return (
        <div className="mt-6 flex justify-center">
            <Button
                className="rounded-full px-6"
                disabled={isLoadingMore}
                onClick={onLoadMore}
                type="button"
                variant="outline"
            >
                {isLoadingMore ? "Loading posts..." : "Load more posts"}
            </Button>
        </div>
    )
}
