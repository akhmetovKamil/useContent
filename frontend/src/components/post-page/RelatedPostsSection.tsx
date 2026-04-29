import type { FeedPostDto } from "@shared/types/posts"

import { PostFeed } from "@/components/posts/PostFeed"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"

interface RelatedPostsSectionProps {
    authorLabel: string
    isHidden: boolean
    posts: FeedPostDto[]
}

export function RelatedPostsSection({ authorLabel, isHidden, posts }: RelatedPostsSectionProps) {
    if (posts.length) {
        return (
            <Card className="rounded-[32px]">
                <CardHeader>
                    <CardTitle>More from {authorLabel}</CardTitle>
                </CardHeader>
                <CardContent>
                    <PostFeed emptyLabel="No related posts yet." posts={posts} />
                </CardContent>
            </Card>
        )
    }

    if (isHidden) {
        return null
    }

    return (
        <EmptyState
            description="Related posts from this author will appear here."
            title="No related posts"
        />
    )
}
