import type { ContentStatus } from "@shared/types/posts"

import { ContentManagerItemCard } from "@/components/content-manager/ContentManagerItemCard"
import { EmptyState } from "@/components/ui/empty-state"
import { LoadingMessage } from "@/components/ui/query-state"
import type { ContentManagerKind, ManagedContentItem } from "@/types/content-manager"

interface ContentManagerListProps {
    emptyLabel: string
    isLoading: boolean
    items?: ManagedContentItem[]
    kind: ContentManagerKind
    loadingLabel: string
    onArchive?: (itemId: string) => Promise<unknown>
    onOpen?: (item: ManagedContentItem) => void
    onRequestDelete: (item: ManagedContentItem) => void
    onToggleStatus: (itemId: string, status: ContentStatus) => Promise<unknown>
}

export function ContentManagerList({
    emptyLabel,
    isLoading,
    items,
    kind,
    loadingLabel,
    onArchive,
    onOpen,
    onRequestDelete,
    onToggleStatus,
}: ContentManagerListProps) {
    return (
        <div className="grid gap-4">
            {isLoading ? <LoadingMessage>{loadingLabel}</LoadingMessage> : null}

            {items?.length ? (
                items.map((item) => (
                    <ContentManagerItemCard
                        item={item}
                        key={item.id}
                        kind={kind}
                        onArchive={onArchive}
                        onOpen={onOpen}
                        onRequestDelete={onRequestDelete}
                        onToggleStatus={onToggleStatus}
                    />
                ))
            ) : !isLoading ? (
                <EmptyState description={emptyLabel} title={`No ${kind}s yet`} />
            ) : null}
        </div>
    )
}
