import { CONTENT_STATUS } from "@shared/consts"
import type { PostDto } from "@shared/types/posts"

import { PostFeed } from "@/components/posts/PostFeed"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { postEmptyLabels, postTabs } from "@/constants/posts"
import type { AuthorPostsTab } from "@/types/navigation"
import { cn } from "@/utils/cn"

interface PostWorkspaceTabsProps {
    activeListError?: Error | null
    activeTab: AuthorPostsTab
    archivedCount: number
    draftCount: number
    isActiveListError: boolean
    isActiveListLoading: boolean
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

export function PostWorkspaceTabs({
    activeListError,
    activeTab,
    archivedCount,
    draftCount,
    isActiveListError,
    isActiveListLoading,
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
                                    {getTabCount({
                                        archivedCount,
                                        draftCount,
                                        promotedCount,
                                        publishedCount,
                                        tab: tab.id,
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
                        isAuthorView
                        onArchive={onArchive}
                        onDelete={onDelete}
                        onEdit={onEdit}
                        onPromote={onPromote}
                        onPublish={onPublish}
                        onRestoreDraft={onRestoreDraft}
                        onStopPromotion={onStopPromotion}
                        onUnarchive={onUnarchive}
                        posts={visiblePosts}
                    />
                )}
            </CardContent>
        </Card>
    )
}

function getTabCount({
    archivedCount,
    draftCount,
    promotedCount,
    publishedCount,
    tab,
}: {
    archivedCount: number
    draftCount: number
    promotedCount: number
    publishedCount: number
    tab: AuthorPostsTab
}) {
    if (tab === CONTENT_STATUS.PUBLISHED) {
        return publishedCount
    }
    if (tab === "drafts") {
        return draftCount
    }
    if (tab === "promoted") {
        return promotedCount
    }
    return archivedCount
}
