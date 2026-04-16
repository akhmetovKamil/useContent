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
            emptyLabel="Постов пока нет."
            intro="Для custom-доступа выбери сохраненную access policy. Новые условия создаются на странице Access."
            isError={postsQuery.isError}
            isLoading={postsQuery.isLoading}
            items={postsQuery.data}
            kind="post"
            loadError={postsQuery.error}
            loadingLabel="Загружаем посты..."
            missingSessionLabel="После входа здесь будут посты автора и следующие шаги для создания редактора."
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
