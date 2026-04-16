import { ContentManagerPage } from "@/components/content-manager/ContentManagerPage"
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

    return (
        <ContentManagerPage
            accessPolicies={policiesQuery.data}
            createError={createPostMutation.error}
            createPending={createPostMutation.isPending}
            emptyLabel="No posts yet."
            intro="For custom access, choose a saved access policy. New conditions are created on the Access page."
            isError={postsQuery.isError}
            isLoading={postsQuery.isLoading}
            items={postsQuery.data}
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
            title="Drafts, published posts, and access rules"
            token={token}
        />
    )
}
