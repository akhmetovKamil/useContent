import type { PostDto } from "@shared/types/content"
import { useState } from "react"
import { Link } from "react-router-dom"

import { PostComposer } from "@/components/posts/PostComposer"
import { PostFeed } from "@/components/posts/PostFeed"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Modal } from "@/components/ui/modal"
import { Eyebrow, PageSection, PageTitle } from "@/components/ui/page"
import { Textarea } from "@/components/ui/textarea"
import { useMyAccessPoliciesQuery } from "@/queries/access-policies"
import {
    useCreateMyPostMutation,
    useDeleteMyPostMutation,
    useMyPostsQuery,
    useUpdateMyPostMutation,
    useUploadMyPostAttachmentMutation,
} from "@/queries/posts"
import { useMyAuthorProfileQuery } from "@/queries/profile"
import { useMyProjectsQuery } from "@/queries/projects"
import { useAuthStore } from "@/stores/auth-store"

export function MePostsPage() {
    const token = useAuthStore((state) => state.token)
    const postsQuery = useMyPostsQuery(Boolean(token))
    const authorQuery = useMyAuthorProfileQuery(Boolean(token))
    const policiesQuery = useMyAccessPoliciesQuery(Boolean(token))
    const projectsQuery = useMyProjectsQuery(Boolean(token))
    const createPostMutation = useCreateMyPostMutation()
    const updatePostMutation = useUpdateMyPostMutation()
    const deletePostMutation = useDeleteMyPostMutation()
    const uploadAttachmentMutation = useUploadMyPostAttachmentMutation()
    const [showEditor, setShowEditor] = useState(false)
    const [showArchive, setShowArchive] = useState(false)
    const [editingPost, setEditingPost] = useState<PostDto | null>(null)
    const [editContent, setEditContent] = useState("")
    const [editTitle, setEditTitle] = useState("")
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
                <PostComposer
                    accessPolicies={policiesQuery.data}
                    createError={createPostMutation.error}
                    isPending={createPostMutation.isPending || uploadAttachmentMutation.isPending}
                    projectOptions={projectsQuery.data}
                    onSubmit={async (input, files) => {
                        const post = await createPostMutation.mutateAsync(input)
                        await Promise.all(
                            files.map((file) =>
                                uploadAttachmentMutation.mutateAsync({ file, postId: post.id })
                            )
                        )
                    }}
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
                                setEditingPost(post)
                                setEditTitle(post.title)
                                setEditContent(post.content)
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
                                onUnarchive={(post) =>
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

            <Modal
                description="Update the post copy without changing its access policy or attachments."
                onOpenChange={(open) => {
                    if (!open) {
                        setEditingPost(null)
                    }
                }}
                open={Boolean(editingPost)}
                title="Edit post"
            >
                <form
                    className="grid gap-4"
                    onSubmit={(event) => {
                        event.preventDefault()
                        if (!editingPost) {
                            return
                        }
                        void updatePostMutation
                            .mutateAsync({
                                postId: editingPost.id,
                                input: {
                                    content: editContent,
                                    title: editTitle,
                                },
                            })
                            .then(() => setEditingPost(null))
                    }}
                >
                    <Input
                        onChange={(event) => setEditTitle(event.target.value)}
                        placeholder="Post title"
                        value={editTitle}
                    />
                    <Textarea
                        className="min-h-40"
                        onChange={(event) => setEditContent(event.target.value)}
                        placeholder="Post content"
                        value={editContent}
                    />
                    <div className="flex justify-end gap-2">
                        <Button
                            onClick={() => setEditingPost(null)}
                            type="button"
                            variant="outline"
                        >
                            Cancel
                        </Button>
                        <Button disabled={updatePostMutation.isPending} type="submit">
                            Save changes
                        </Button>
                    </div>
                </form>
            </Modal>
        </section>
    )
}
