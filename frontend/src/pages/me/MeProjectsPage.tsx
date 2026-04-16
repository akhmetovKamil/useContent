import { ContentManagerPage } from "@/components/content-manager/ContentManagerPage"
import { useMyAccessPoliciesQuery } from "@/queries/access-policies"
import {
    useCreateMyProjectMutation,
    useDeleteMyProjectMutation,
    useMyProjectsQuery,
    useUpdateMyProjectMutation,
} from "@/queries/projects"
import { useAuthStore } from "@/stores/auth-store"

export function MeProjectsPage() {
    const token = useAuthStore((state) => state.token)
    const projectsQuery = useMyProjectsQuery(Boolean(token))
    const policiesQuery = useMyAccessPoliciesQuery(Boolean(token))
    const createProjectMutation = useCreateMyProjectMutation()
    const updateProjectMutation = useUpdateMyProjectMutation()
    const deleteProjectMutation = useDeleteMyProjectMutation()

    return (
        <ContentManagerPage
            accessPolicies={policiesQuery.data}
            createError={createProjectMutation.error}
            createPending={createProjectMutation.isPending}
            emptyLabel="No projects yet."
            intro="For custom access, choose a saved access policy. New conditions are created on the Access page."
            isError={projectsQuery.isError}
            isLoading={projectsQuery.isLoading}
            items={projectsQuery.data}
            kind="project"
            loadError={projectsQuery.error}
            loadingLabel="Loading projects..."
            missingSessionLabel="After sign-in, project trees and the file side of the content platform will appear here."
            onCreate={({ accessPolicyId, body, policyMode, status, title }) =>
                createProjectMutation.mutateAsync({
                    accessPolicyId,
                    description: body,
                    policyMode,
                    status,
                    title,
                })
            }
            onDelete={(projectId) => deleteProjectMutation.mutateAsync(projectId)}
            onToggleStatus={(projectId, status) =>
                updateProjectMutation.mutateAsync({
                    projectId,
                    input: { status },
                })
            }
            title="Structured project spaces with gated access"
            token={token}
        />
    )
}
