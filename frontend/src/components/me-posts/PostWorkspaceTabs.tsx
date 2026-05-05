import type { PostDto } from "@shared/types/posts"
import { useEffect, useMemo, useState } from "react"

import { LoadMorePostsButton } from "@/components/posts/LoadMorePostsButton"
import { PostFeed } from "@/components/posts/PostFeed"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { postEmptyLabels, postTabs } from "@/constants/posts"
import type { AuthorPostsTab } from "@/types/navigation"
import { cn } from "@/utils/cn"
import { getPostTabCount } from "@/utils/post-tabs"

interface PostWorkspaceTabsProps {
    activeListError?: Error | null
    activeTab: AuthorPostsTab
    archivedCount: number
    draftCount: number
    isActiveListError: boolean
    isActiveListLoading: boolean
    isPromoteLocked?: boolean
    onArchive: (post: PostDto) => void
    onDelete: (post: PostDto) => void
    onEdit: (post: PostDto) => void
    onPromote: (post: PostDto) => void
    onPublish: (post: PostDto) => void
    onRestoreDraft: (post: PostDto) => void
    onStopPromotion: (post: PostDto) => void
    onTabChange: (tab: AuthorPostsTab) => void
    onUnarchive: (post: PostDto) => void
    promotedCount: number
    publishedCount: number
    visiblePosts?: PostDto[]
}

const POSTS_PER_PAGE = 6

export function PostWorkspaceTabs({
    activeListError,
    activeTab,
    archivedCount,
    draftCount,
    isActiveListError,
    isActiveListLoading,
    isPromoteLocked = false,
    onArchive,
    onDelete,
    onEdit,
    onPromote,
    onPublish,
    onRestoreDraft,
    onStopPromotion,
    onTabChange,
    onUnarchive,
    promotedCount,
    publishedCount,
    visiblePosts,
}: PostWorkspaceTabsProps) {
    const [page, setPage] = useState(1)
    const posts = visiblePosts ?? []
    const totalPages = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE))
    const paginatedPosts = useMemo(
        () => posts.slice(0, page * POSTS_PER_PAGE),
        [page, posts]
    )

    useEffect(() => {
        setPage(1)
    }, [activeTab])

    useEffect(() => {
        if (page > totalPages) {
            setPage(totalPages)
        }
    }, [page, totalPages])

    return (
        <Card className="overflow-hidden rounded-[28px]">
            <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <CardTitle>Publishing workspace</CardTitle>
                        <p className="mt-2 text-sm text-[var(--muted)]">
                            Manage drafts, published posts, archived content and promoted updates
                            from one place.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {postTabs.map((tab) => (
                            <button
                                className={cn(
                                    "rounded-full border border-[var(--line)] px-4 py-2 text-sm font-medium transition",
                                    activeTab === tab.id
                                        ? "bg-[var(--foreground)] text-[var(--background)]"
                                        : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)]"
                                )}
                                key={tab.id}
                                onClick={() => onTabChange(tab.id)}
                                type="button"
                            >
                                {tab.label}
                                <span className="ml-2 opacity-70">
                                    {getPostTabCount(tab.id, {
                                        archivedCount,
                                        draftCount,
                                        promotedCount,
                                        publishedCount,
                                    })}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {isActiveListLoading ? (
                    <p className="text-[var(--muted)]">Loading posts...</p>
                ) : isActiveListError ? (
                    <p className="text-rose-600">{activeListError?.message}</p>
                ) : (
                    <PostFeed
                        emptyLabel={postEmptyLabels[activeTab]}
                        isPromoteLocked={isPromoteLocked}
                        isAuthorView
                        onArchive={onArchive}
                        onDelete={onDelete}
                        onEdit={onEdit}
                        onPromote={onPromote}
                        onPublish={onPublish}
                        onRestoreDraft={onRestoreDraft}
                        onStopPromotion={onStopPromotion}
                        onUnarchive={onUnarchive}
                        posts={paginatedPosts}
                    />
                )}
                {!isActiveListLoading && !isActiveListError ? (
                    <>
                        {posts.length > POSTS_PER_PAGE ? (
                            <p className="mt-4 text-center text-sm text-[var(--muted)]">
                                Showing {paginatedPosts.length} of {posts.length} posts
                            </p>
                        ) : null}
                        <LoadMorePostsButton
                            hasMore={paginatedPosts.length < posts.length}
                            isLoadingMore={false}
                            onLoadMore={() => setPage((value) => Math.min(value + 1, totalPages))}
                        />
                    </>
                ) : null}
            </CardContent>
        </Card>
    )
}
