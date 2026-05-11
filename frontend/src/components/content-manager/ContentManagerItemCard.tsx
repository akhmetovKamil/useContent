import { CONTENT_STATUS } from "@shared/consts"
import type { ContentStatus } from "@shared/types/posts"
import type { ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ContentManagerKind, ManagedContentItem } from "@/types/content-manager"
import { formatDisplayDate } from "@/utils/date"
import { formatFileSize } from "@/utils/format"

interface ContentManagerItemCardProps {
    item: ManagedContentItem
    kind: ContentManagerKind
    onOpen?: (item: ManagedContentItem) => void
    onArchive?: (itemId: string) => Promise<unknown>
    onRequestDelete: (item: ManagedContentItem) => void
    onToggleStatus: (itemId: string, status: ContentStatus) => Promise<unknown>
    renderExpansion?: (item: ManagedContentItem) => ReactNode
}

export function ContentManagerItemCard({
    item,
    kind,
    onOpen,
    onArchive,
    onRequestDelete,
    onToggleStatus,
    renderExpansion,
}: ContentManagerItemCardProps) {
    const body =
        kind === "post" ? item.content : item.description || "Project description is still empty"
    const expansion = renderExpansion?.(item)

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-wrap items-center gap-3">
                    <CardTitle>{item.title}</CardTitle>
                    <Badge>{item.status}</Badge>
                    <Badge>{item.policyMode}</Badge>
                    {kind === "project" && typeof item.fileCount === "number" ? (
                        <Badge>{item.fileCount} files</Badge>
                    ) : null}
                    {kind === "project" && typeof item.folderCount === "number" ? (
                        <Badge>{item.folderCount} folders</Badge>
                    ) : null}
                    {kind === "project" && typeof item.totalSize === "number" ? (
                        <Badge>{formatFileSize(item.totalSize)}</Badge>
                    ) : null}
                    {kind === "project" && item.updatedAt ? (
                        <Badge>Updated {formatDisplayDate(item.updatedAt)}</Badge>
                    ) : null}
                </div>
            </CardHeader>
            <CardContent>
                <p className="line-clamp-3 text-sm leading-6 text-[var(--muted)]">{body}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                    {onOpen ? (
                        <Button
                            className="rounded-full"
                            onClick={() => onOpen(item)}
                            size="sm"
                            type="button"
                            variant="outline"
                        >
                            {kind === "project" ? "Open project" : "Open"}
                        </Button>
                    ) : null}
                    <Button
                        className="rounded-full"
                        disabled={item.status === CONTENT_STATUS.PUBLISHED}
                        onClick={() => void onToggleStatus(item.id, CONTENT_STATUS.PUBLISHED)}
                        size="sm"
                        type="button"
                        variant="outline"
                    >
                        Publish
                    </Button>
                    {onArchive ? (
                        <Button
                            className="rounded-full"
                            onClick={() => void onArchive(item.id)}
                            size="sm"
                            type="button"
                            variant="outline"
                        >
                            Archive
                        </Button>
                    ) : null}
                    <Button
                        className="rounded-full"
                        onClick={() => onRequestDelete(item)}
                        size="sm"
                        type="button"
                        variant="destructive"
                    >
                        Delete
                    </Button>
                </div>
                {expansion ? <div className="mt-5">{expansion}</div> : null}
            </CardContent>
        </Card>
    )
}
