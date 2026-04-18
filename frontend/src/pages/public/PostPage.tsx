import { useParams } from "react-router-dom"

import { PostFeed } from "@/components/posts/PostFeed"
import { useAuthorPostQuery } from "@/queries/posts"

export function PostPage() {
    const { slug, postId } = useParams()
    const postQuery = useAuthorPostQuery(slug ?? "", postId ?? "")

    return (
        <section className="rounded-[28px] border border-[var(--line)] bg-[var(--surface-strong)] p-6 md:p-8">
            <div className="font-mono text-xs uppercase tracking-[0.35em] text-[var(--muted)]">
                Post view
            </div>
            {postQuery.isLoading ? (
                <p className="mt-3 text-[var(--muted)]">Loading post...</p>
            ) : postQuery.isError ? (
                <p className="mt-3 text-rose-600">
                    Failed to open @{slug}'s post: {postQuery.error.message}
                </p>
            ) : postQuery.data ? (
                <div className="mt-5">
                    <PostFeed
                        emptyLabel="Post not found."
                        posts={[
                            {
                                ...postQuery.data,
                                authorDisplayName: slug ?? "Author",
                                authorSlug: slug ?? "",
                                accessLabel: null,
                                hasAccess: true,
                            },
                        ]}
                    />
                </div>
            ) : null}
        </section>
    )
}
