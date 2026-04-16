import { useState } from "react"

import { ContentManagerPage } from "@/components/content-manager/ContentManagerPage"
import { PostFeed } from "@/components/posts/PostFeed"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eyebrow, PageSection, PageTitle } from "@/components/ui/page"
import { useMyAccessPoliciesQuery } from "@/queries/access-policies"
import {
    useCreateMyPostMutation,
    useDeleteMyPostMutation,
    useMyPostsQuery,
    useUpdateMyPostMutation,
} from "@/queries/posts"
import { useAuthStore } from "@/stores/auth-store"

export function MePostsPage() {
    const token = useAuthStore((state) => state.token)
    const postsQuery = useMyPostsQuery(Boolean(token))
    const policiesQuery = useMyAccessPoliciesQuery(Boolean(token))
    const createPostMutation = useCreateMyPostMutation()
    const updatePostMutation = useUpdateMyPostMutation()
    const deletePostMutation = useDeleteMyPostMutation()
    const [showEditor, setShowEditor] = useState(false)

    return (
        <section className="grid gap-6">
            <PageSection>
                <Eyebrow>posts</Eyebrow>
                <PageTitle>Author post feed</PageTitle>
                <div className="mt-5 flex flex-wrap gap-3">
                    <Button
                        className="rounded-full"
                        onClick={() => setShowEditor((value) => !value)}
                    >
                        {showEditor ? "Hide editor" : "Create post"}
                    </Button>
                    <Button className="rounded-full" disabled variant="outline">
                        Projects coming soon
                    </Button>
                </div>
            </PageSection>

            {showEditor ? (
                <ContentManagerPage
                    accessPolicies={policiesQuery.data}
                    createError={createPostMutation.error}
                    createPending={createPostMutation.isPending}
                    emptyLabel="No posts yet."
                    intro="For custom access, choose a saved access policy. New conditions are created on the Access page."
                    isError={postsQuery.isError}
                    isLoading={postsQuery.isLoading}
                    items={[]}
                    kind="post"
                    loadError={postsQuery.error}
                    loadingLabel="Loading posts..."
                    missingSessionLabel="After sign-in, author posts and the next editor steps will appear here."
                    onCreate={({ accessPolicyId, body, policyMode, status, title }) =>
                        createPostMutation.mutateAsync({
                            accessPolicyId,
                            content: body,
                            policyMode,
                            status,
                            title,
                        })
                    }
                    onDelete={(postId) => deletePostMutation.mutateAsync(postId)}
                    onToggleStatus={(postId, status) =>
                        updatePostMutation.mutateAsync({
                            postId,
                            input: { status },
                        })
                    }
                    title="Create a new post"
                    token={token}
                />
            ) : null}

            <Card className="rounded-[28px]">
                <CardHeader>
                    <CardTitle>Posts</CardTitle>
                </CardHeader>
                <CardContent>
                    {postsQuery.isLoading ? (
                        <p className="text-[var(--muted)]">Loading posts...</p>
                    ) : postsQuery.isError ? (
                        <p className="text-rose-600">{postsQuery.error.message}</p>
                    ) : (
                        <PostFeed
                            emptyLabel="No posts yet."
                            isAuthorView
                            onArchive={(post) =>
                                void updatePostMutation.mutateAsync({
                                    postId: post.id,
                                    input: { status: "draft" },
                                })
                            }
                            onDelete={(post) => void deletePostMutation.mutateAsync(post.id)}
                            onEdit={(post) => {
                                const title = window.prompt("Post title", post.title)
                                if (title === null) {
                                    return
                                }

                                const content = window.prompt("Post content", post.content)
                                if (content === null) {
                                    return
                                }

                                void updatePostMutation.mutateAsync({
                                    postId: post.id,
                                    input: { content, title },
                                })
                            }}
                            posts={postsQuery.data}
                        />
                    )}
                </CardContent>
            </Card>
        </section>
    )
}
