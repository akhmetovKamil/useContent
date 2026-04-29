import { CONTENT_STATUS } from "@shared/consts"
import type { ContentStatus } from "@shared/types/posts"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ContentManagerKind, ManagedContentItem } from "@/types/content-manager"
import { formatFileSize } from "@/utils/format"

interface ContentManagerItemCardProps {
    item: ManagedContentItem
    kind: ContentManagerKind
    onOpen?: (item: ManagedContentItem) => void
    onArchive?: (itemId: string) => Promise<unknown>
    onRequestDelete: (item: ManagedContentItem) => void
    onToggleStatus: (itemId: string, status: ContentStatus) => Promise<unknown>
}

export function ContentManagerItemCard({
    item,
    kind,
    onOpen,
    onArchive,
    onRequestDelete,
    onToggleStatus,
}: ContentManagerItemCardProps) {
    const body =
        kind === "post" ? item.content : item.description || "Project description is still empty"

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-wrap items-center gap-3">
                    <CardTitle>{item.title}</CardTitle>
                    <Badge>{item.status}</Badge>
                    <Badge>{item.policyMode}</Badge>
                    {kind === "project" && typeof item.totalSize === "number" ? (
                        <Badge>{formatFileSize(item.totalSize)}</Badge>
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
                            Open files
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
            </CardContent>
        </Card>
    )
}
