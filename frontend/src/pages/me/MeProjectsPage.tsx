import type { ProjectDto } from "@contracts/types/content"
import { useEffect, useState } from "react"

import { ContentManagerPage } from "@/components/content-manager/ContentManagerPage"
import { ProjectFileTree } from "@/components/project-tree/ProjectFileTree"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
    const [selectedProject, setSelectedProject] = useState<ProjectDto | null>(null)
    const [showArchive, setShowArchive] = useState(false)
    const projectsQuery = useMyProjectsQuery(Boolean(token))
    const archivedProjectsQuery = useMyProjectsQuery(Boolean(token) && showArchive, "archived")
    const policiesQuery = useMyAccessPoliciesQuery(Boolean(token))
    const createProjectMutation = useCreateMyProjectMutation()
    const updateProjectMutation = useUpdateMyProjectMutation()
    const deleteProjectMutation = useDeleteMyProjectMutation()

    useEffect(() => {
        if (!selectedProject || !projectsQuery.data) {
            return
        }

        const freshProject = projectsQuery.data.find((project) => project.id === selectedProject.id)
        if (!freshProject) {
            setSelectedProject(null)
            return
        }

        if (freshProject !== selectedProject) {
            setSelectedProject(freshProject)
        }
    }, [projectsQuery.data, selectedProject])

    return (
        <div className="grid gap-6">
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
                onOpen={(project) => setSelectedProject(project as ProjectDto)}
                onArchive={(projectId) =>
                    updateProjectMutation.mutateAsync({
                        projectId,
                        input: { status: "archived" },
                    })
                }
                onToggleStatus={(projectId, status) =>
                    updateProjectMutation.mutateAsync({
                        projectId,
                        input: { status },
                    })
                }
                title="Structured project spaces with private access"
                token={token}
            />

            <button
                className="w-fit text-sm text-[var(--muted)] underline underline-offset-4"
                onClick={() => setShowArchive((value) => !value)}
                type="button"
            >
                {showArchive ? "Hide archive" : "Open archive"}
            </button>

            {showArchive ? (
                <ContentManagerPage
                    createPending={false}
                    emptyLabel="Project archive is empty."
                    hideCreate
                    intro="Archived project spaces are hidden from public profiles until you publish them again."
                    isError={archivedProjectsQuery.isError}
                    isLoading={archivedProjectsQuery.isLoading}
                    items={archivedProjectsQuery.data}
                    kind="project"
                    loadError={archivedProjectsQuery.error}
                    loadingLabel="Loading archived projects..."
                    missingSessionLabel="Sign in to manage archived projects."
                    onCreate={() => Promise.resolve()}
                    onDelete={(projectId) => deleteProjectMutation.mutateAsync(projectId)}
                    onOpen={(project) => setSelectedProject(project as ProjectDto)}
                    onToggleStatus={(projectId) =>
                        updateProjectMutation.mutateAsync({
                            projectId,
                            input: { status: "published" },
                        })
                    }
                    title="Archived project spaces"
                    token={token}
                />
            ) : null}

            {selectedProject ? (
                <Card>
                    <CardHeader>
                        <CardTitle>{selectedProject.title}</CardTitle>
                        <div className="flex flex-wrap gap-2">
                            <Badge className="rounded-full">{selectedProject.status}</Badge>
                            <Badge className="rounded-full">
                                {selectedProject.fileCount} files
                            </Badge>
                            <Badge className="rounded-full">
                                {selectedProject.folderCount} folders
                            </Badge>
                            <Badge className="rounded-full">
                                {formatFileSize(selectedProject.totalSize)}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--muted)]">
                            {selectedProject.description || "Project description is still empty."}
                        </p>
                        <ProjectFileTree
                            mode="author"
                            projectId={selectedProject.id}
                            rootNodeId={selectedProject.rootNodeId}
                        />
                    </CardContent>
                </Card>
            ) : null}
        </div>
    )
}

function formatFileSize(size: number) {
    if (size < 1024) {
        return `${size} B`
    }
    if (size < 1024 * 1024) {
        return `${(size / 1024).toFixed(1)} KB`
    }
    return `${(size / 1024 / 1024).toFixed(1)} MB`
}
