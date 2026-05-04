import { CONTENT_STATUS } from "@shared/consts"
import type { ProjectDto } from "@shared/types/projects"
import { LockKeyhole } from "lucide-react"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import { ContentManager } from "@/components/content-manager/ContentManager"
import { ProjectFileTree } from "@/components/project-tree/ProjectFileTree"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useMyAccessPoliciesQuery } from "@/queries/access-policies"
import { useMyAuthorPlatformBillingQuery } from "@/queries/platform"
import {
    useCreateMyProjectMutation,
    useDeleteMyProjectMutation,
    useMyProjectsQuery,
    useUpdateMyProjectMutation,
} from "@/queries/projects"
import { useAuthStore } from "@/stores/auth-store"
import { formatFileSize } from "@/utils/format"

export function MeProjectsPage() {
    const token = useAuthStore((state) => state.token)
    const [selectedProject, setSelectedProject] = useState<ProjectDto | null>(null)
    const [showArchive, setShowArchive] = useState(false)
    const billingQuery = useMyAuthorPlatformBillingQuery(Boolean(token))
    const projectsLocked =
        billingQuery.isSuccess &&
        Boolean(
            !billingQuery.data.features.includes("projects") ||
                !billingQuery.data.isProjectCreationAllowed
        )
    const projectsEnabled = Boolean(token) && billingQuery.isSuccess && !projectsLocked
    const projectsQuery = useMyProjectsQuery(projectsEnabled)
    const archivedProjectsQuery = useMyProjectsQuery(
        projectsEnabled && showArchive,
        CONTENT_STATUS.ARCHIVED
    )
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

    if (billingQuery.isLoading) {
        return (
            <Card className="rounded-[28px]">
                <CardContent className="pt-6 text-sm text-[var(--muted)]">
                    Checking project access...
                </CardContent>
            </Card>
        )
    }

    if (projectsLocked) {
        return (
            <Card className="overflow-hidden rounded-[28px]">
                <CardContent className="grid gap-5 p-6 md:p-8">
                    <div className="grid size-12 place-items-center rounded-2xl bg-[var(--accent-soft)]">
                        <LockKeyhole className="size-6 text-[var(--foreground)]" />
                    </div>
                    <div>
                        <CardTitle>Projects are available on Basic</CardTitle>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                            Your current platform plan keeps project spaces locked. Upgrade to Basic
                            to create projects, upload structured files, and attach project spaces
                            to posts.
                        </p>
                    </div>
                    <Button asChild className="w-fit rounded-full">
                        <Link to="/me/platform-billing">Open billing</Link>
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="grid gap-6">
            <ContentManager
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
                        input: { status: CONTENT_STATUS.ARCHIVED },
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
                <ContentManager
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
                            input: { status: CONTENT_STATUS.PUBLISHED },
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
