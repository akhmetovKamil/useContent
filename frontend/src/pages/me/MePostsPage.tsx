import { CONTENT_STATUS } from "@shared/consts"
import type { PostDto } from "@shared/types/posts"
import { useState } from "react"
import { Link } from "react-router-dom"

import { PostEditorModal } from "@/components/me-posts/PostEditorModal"
import { PostWorkspaceTabs } from "@/components/me-posts/PostWorkspaceTabs"
import { PostComposer } from "@/components/posts/PostComposer"
import { Button } from "@/components/ui/button"
import { Eyebrow, PageSection, PageTitle } from "@/components/ui/page"
import { useMyAccessPoliciesQuery } from "@/queries/access-policies"
import {
    useCreateMyPostMutation,
    useDeleteMyPostMutation,
    useMyPostsQuery,
    usePromoteMyPostMutation,
    useStopPromotingMyPostMutation,
    useUpdateMyPostMutation,
    useUploadMyPostAttachmentMutation,
} from "@/queries/posts"
import { useMyAuthorProfileQuery } from "@/queries/profile"
import { useMyProjectsQuery } from "@/queries/projects"
import { useAuthStore } from "@/stores/auth-store"
import type { AuthorPostsTab } from "@/types/navigation"

export function MePostsPage() {
    const token = useAuthStore((state) => state.token)
    const postsQuery = useMyPostsQuery(Boolean(token))
    const authorQuery = useMyAuthorProfileQuery(Boolean(token))
    const policiesQuery = useMyAccessPoliciesQuery(Boolean(token))
    const projectsQuery = useMyProjectsQuery(Boolean(token))
    const createPostMutation = useCreateMyPostMutation()
    const updatePostMutation = useUpdateMyPostMutation()
    const deletePostMutation = useDeleteMyPostMutation()
    const promotePostMutation = usePromoteMyPostMutation()
    const stopPromotionMutation = useStopPromotingMyPostMutation()
    const uploadAttachmentMutation = useUploadMyPostAttachmentMutation()
    const [showEditor, setShowEditor] = useState(false)
    const [activeTab, setActiveTab] = useState<AuthorPostsTab>(CONTENT_STATUS.PUBLISHED)
    const [editingPost, setEditingPost] = useState<PostDto | null>(null)
    const [editContent, setEditContent] = useState("")
    const [editTitle, setEditTitle] = useState("")
    const archivedPostsQuery = useMyPostsQuery(
        Boolean(token) && activeTab === CONTENT_STATUS.ARCHIVED,
        CONTENT_STATUS.ARCHIVED
    )
    const authorSlug = authorQuery.data?.slug ?? ""
    const authorDisplayName = authorQuery.data?.displayName ?? "Author"
    const authorAvatarFileId = authorQuery.data?.avatarFileId ?? null
    const activePosts = authorSlug
        ? postsQuery.data?.map((post) => ({
              ...post,
              authorDisplayName,
              authorAvatarFileId,
              authorSlug,
              accessLabel: null,
              hasAccess: true,
          }))
        : postsQuery.data
    const archivedPosts = authorSlug
        ? archivedPostsQuery.data?.map((post) => ({
              ...post,
              authorDisplayName,
              authorAvatarFileId,
              authorSlug,
              accessLabel: null,
              hasAccess: true,
          }))
        : archivedPostsQuery.data
    const publishedPosts =
        activePosts?.filter((post) => post.status === CONTENT_STATUS.PUBLISHED) ?? []
    const draftPosts = activePosts?.filter((post) => post.status === CONTENT_STATUS.DRAFT) ?? []
    const promotedPosts =
        activePosts?.filter(
            (post) => post.promotion?.active && post.status === CONTENT_STATUS.PUBLISHED
        ) ?? []
    const visiblePosts =
        activeTab === CONTENT_STATUS.PUBLISHED
            ? publishedPosts
            : activeTab === "drafts"
              ? draftPosts
              : activeTab === "promoted"
                ? promotedPosts
                : archivedPosts
    const isActiveListLoading =
        activeTab === CONTENT_STATUS.ARCHIVED ? archivedPostsQuery.isLoading : postsQuery.isLoading
    const activeListError =
        activeTab === CONTENT_STATUS.ARCHIVED ? archivedPostsQuery.error : postsQuery.error
    const isActiveListError =
        activeTab === CONTENT_STATUS.ARCHIVED ? archivedPostsQuery.isError : postsQuery.isError

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
                        const attachments = await Promise.all(
                            files.map((file) =>
                                uploadAttachmentMutation.mutateAsync({ file, postId: post.id })
                            )
                        )
                        if (attachments.length) {
                            await updatePostMutation.mutateAsync({
                                postId: post.id,
                                input: {
                                    attachmentIds: attachments.map((attachment) => attachment.id),
                                    mediaGridLayout: input.mediaGridLayout,
                                    mediaLayout: input.mediaLayout,
                                },
                            })
                        }
                    }}
                />
            ) : null}

            <PostWorkspaceTabs
                activeListError={activeListError}
                activeTab={activeTab}
                archivedCount={archivedPosts?.length ?? 0}
                draftCount={draftPosts.length}
                isActiveListError={isActiveListError}
                isActiveListLoading={isActiveListLoading}
                onArchive={(post) => updatePostStatus(post, CONTENT_STATUS.ARCHIVED)}
                onDelete={(post) => void deletePostMutation.mutateAsync(post.id)}
                onEdit={(post) => {
                    setEditingPost(post)
                    setEditTitle(post.title)
                    setEditContent(post.content)
                }}
                onPromote={(post) => void promotePostMutation.mutateAsync(post.id)}
                onPublish={(post) => updatePostStatus(post, CONTENT_STATUS.PUBLISHED)}
                onRestoreDraft={(post) => updatePostStatus(post, CONTENT_STATUS.DRAFT)}
                onStopPromotion={(post) => void stopPromotionMutation.mutateAsync(post.id)}
                onTabChange={setActiveTab}
                onUnarchive={(post) => updatePostStatus(post, CONTENT_STATUS.PUBLISHED)}
                promotedCount={promotedPosts.length}
                publishedCount={publishedPosts.length}
                visiblePosts={visiblePosts}
            />

            <PostEditorModal
                editContent={editContent}
                editTitle={editTitle}
                editingPost={editingPost}
                isPending={updatePostMutation.isPending}
                onContentChange={setEditContent}
                onOpenChange={(open) => {
                    if (!open) {
                        setEditingPost(null)
                    }
                }}
                onSave={async () => {
                    if (!editingPost) {
                        return
                    }
                    await updatePostMutation.mutateAsync({
                        postId: editingPost.id,
                        input: {
                            content: editContent,
                            title: editTitle,
                        },
                    })
                    setEditingPost(null)
                }}
                onTitleChange={setEditTitle}
            />
        </section>
    )
}
