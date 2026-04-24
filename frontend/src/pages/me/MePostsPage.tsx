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
import { cn } from "@/utils/cn"

type AuthorPostsTab = "published" | "drafts" | "archived" | "promoted"

const postTabs: Array<{ id: AuthorPostsTab; label: string }> = [
    { id: "published", label: "Published" },
    { id: "drafts", label: "Drafts" },
    { id: "archived", label: "Archived" },
    { id: "promoted", label: "Promoted" },
]

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
    const [activeTab, setActiveTab] = useState<AuthorPostsTab>("published")
    const [editingPost, setEditingPost] = useState<PostDto | null>(null)
    const [editContent, setEditContent] = useState("")
    const [editTitle, setEditTitle] = useState("")
    const archivedPostsQuery = useMyPostsQuery(Boolean(token) && activeTab === "archived", "archived")
    const authorSlug = authorQuery.data?.slug ?? ""
    const authorDisplayName = authorQuery.data?.displayName ?? "Author"
    const activePosts = authorSlug
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
    const publishedPosts = activePosts?.filter((post) => post.status === "published") ?? []
    const draftPosts = activePosts?.filter((post) => post.status === "draft") ?? []
    const promotedPosts =
        activePosts?.filter((post) => isPromotedPost(post) && post.status === "published") ?? []
    const visiblePosts =
        activeTab === "published"
            ? publishedPosts
            : activeTab === "drafts"
              ? draftPosts
              : activeTab === "promoted"
                ? promotedPosts
                : archivedPosts
    const isActiveListLoading =
        activeTab === "archived" ? archivedPostsQuery.isLoading : postsQuery.isLoading
    const activeListError =
        activeTab === "archived" ? archivedPostsQuery.error : postsQuery.error
    const isActiveListError =
        activeTab === "archived" ? archivedPostsQuery.isError : postsQuery.isError

    function updatePostStatus(post: PostDto, status: PostDto["status"]) {
        void updatePostMutation.mutateAsync({
            postId: post.id,
            input: { status },
        })
    }

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
                            {postTabs.map((tab) => {
                                const count =
                                    tab.id === "published"
                                        ? publishedPosts.length
                                        : tab.id === "drafts"
                                          ? draftPosts.length
                                          : tab.id === "promoted"
                                            ? promotedPosts.length
                                            : archivedPosts?.length ?? 0

                                return (
                                    <button
                                        className={cn(
                                            "rounded-full border border-[var(--line)] px-4 py-2 text-sm font-medium transition",
                                            activeTab === tab.id
                                                ? "bg-[var(--foreground)] text-[var(--background)]"
                                                : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)]",
                                        )}
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        type="button"
                                    >
                                        {tab.label}
                                        <span className="ml-2 opacity-70">{count}</span>
                                    </button>
                                )
                            })}
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
                            emptyLabel={getEmptyLabel(activeTab)}
                            isAuthorView
                            onArchive={(post) => updatePostStatus(post, "archived")}
                            onDelete={(post) => void deletePostMutation.mutateAsync(post.id)}
                            onEdit={(post) => {
                                setEditingPost(post)
                                setEditTitle(post.title)
                                setEditContent(post.content)
                            }}
                            onPublish={(post) => updatePostStatus(post, "published")}
                            onRestoreDraft={(post) => updatePostStatus(post, "draft")}
                            onUnarchive={(post) => updatePostStatus(post, "published")}
                            posts={visiblePosts}
                        />
                    )}
                </CardContent>
            </Card>

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

function getEmptyLabel(tab: AuthorPostsTab) {
    if (tab === "drafts") {
        return "No drafts yet."
    }
    if (tab === "archived") {
        return "Archive is empty."
    }
    if (tab === "promoted") {
        return "No promoted posts yet."
    }
    return "No published posts yet."
}

function isPromotedPost(post: PostDto) {
    return Boolean((post as PostDto & { promotion?: { active?: boolean } | null }).promotion?.active)
}
