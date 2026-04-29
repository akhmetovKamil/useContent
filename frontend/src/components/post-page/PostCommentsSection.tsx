import type { PostCommentDto } from "@shared/types/posts"

import { InlineComments } from "@/components/posts/InlineComments"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface PostCommentsSectionProps {
    authorId: string
    comments?: PostCommentDto[]
    isError: boolean
    isLoading: boolean
    isPending: boolean
    onSubmit: (content: string) => Promise<unknown>
    token: string | null
}

export function PostCommentsSection({
    authorId,
    comments,
    isError,
    isLoading,
    isPending,
    onSubmit,
    token,
}: PostCommentsSectionProps) {
    return (
        <Card className="rounded-[32px]">
            <CardHeader>
                <CardTitle>Comments</CardTitle>
            </CardHeader>
            <CardContent>
                <InlineComments
                    authorId={authorId}
                    comments={comments}
                    isError={isError}
                    isLoading={isLoading}
                    isPending={isPending}
                    onSubmit={onSubmit}
                    token={token}
                />
            </CardContent>
        </Card>
    )
}
