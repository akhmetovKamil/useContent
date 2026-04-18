import { useState } from "react"
import { Link } from "react-router-dom"

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
import { useMyAuthorProfileQuery } from "@/queries/profile"
import { useAuthStore } from "@/stores/auth-store"

export function MePostsPage() {
    const token = useAuthStore((state) => state.token)
    const postsQuery = useMyPostsQuery(Boolean(token))
    const authorQuery = useMyAuthorProfileQuery(Boolean(token))
    const policiesQuery = useMyAccessPoliciesQuery(Boolean(token))
    const createPostMutation = useCreateMyPostMutation()
    const updatePostMutation = useUpdateMyPostMutation()
    const deletePostMutation = useDeleteMyPostMutation()
    const [showEditor, setShowEditor] = useState(false)
    const [showArchive, setShowArchive] = useState(false)
    const archivedPostsQuery = useMyPostsQuery(Boolean(token) && showArchive, "archived")
    const authorSlug = authorQuery.data?.slug ?? ""
    const authorDisplayName = authorQuery.data?.displayName ?? "Author"
    const posts = authorSlug
        ? postsQuery.data?.map((post) => ({
              ...post,
              authorDisplayName,
              authorSlug,
              accessLabel: null,
              hasAccess: true,
          }))
        : postsQuery.data
    const archivedPosts = authorSlug
        ? archivedPostsQuery.data?.map((post) => ({
              ...post,
              authorDisplayName,
              authorSlug,
              accessLabel: null,
              hasAccess: true,
          }))
        : archivedPostsQuery.data

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
                    <Button asChild className="rounded-full" variant="outline">
                        <Link to="/me/projects">Projects</Link>
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
                    onArchive={(postId) =>
                        updatePostMutation.mutateAsync({
                            postId,
                            input: { status: "archived" },
                        })
                    }
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
                                    input: { status: "archived" },
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
                            onPublish={(post) =>
                                void updatePostMutation.mutateAsync({
                                    postId: post.id,
                                    input: { status: "published" },
                                })
                            }
                            posts={posts}
                        />
                    )}
                    <button
                        className="mt-5 text-sm text-[var(--muted)] underline underline-offset-4"
                        onClick={() => setShowArchive((value) => !value)}
                        type="button"
                    >
                        {showArchive ? "Hide archive" : "Open archive"}
                    </button>
                </CardContent>
            </Card>

            {showArchive ? (
                <Card className="rounded-[28px]">
                    <CardHeader>
                        <CardTitle>Archived posts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {archivedPostsQuery.isLoading ? (
                            <p className="text-[var(--muted)]">Loading archive...</p>
                        ) : archivedPostsQuery.isError ? (
                            <p className="text-rose-600">{archivedPostsQuery.error.message}</p>
                        ) : (
                            <PostFeed
                                emptyLabel="Archive is empty."
                                isAuthorView
                                onDelete={(post) => void deletePostMutation.mutateAsync(post.id)}
                                onPublish={(post) =>
                                    void updatePostMutation.mutateAsync({
                                        postId: post.id,
                                        input: { status: "published" },
                                    })
                                }
                                posts={archivedPosts}
                            />
                        )}
                    </CardContent>
                </Card>
            ) : null}
        </section>
    )
}
