import { useParams } from "react-router-dom"

import { ProjectFileTree } from "@/components/project-tree/ProjectFileTree"
import { Badge } from "@/components/ui/badge"
import { useAuthorProjectQuery } from "@/queries/projects"
import { formatFileSize } from "@/utils/format"

export function ProjectPage() {
    const { slug, projectId } = useParams()
    const projectQuery = useAuthorProjectQuery(slug ?? "", projectId ?? "")

    return (
        <section className="rounded-[28px] border border-[var(--line)] bg-[var(--surface-strong)] p-6 md:p-8">
            <div className="font-mono text-xs uppercase tracking-[0.35em] text-[var(--muted)]">
                Project view
            </div>
            {projectQuery.isLoading ? (
                <p className="mt-3 text-[var(--muted)]">Loading project...</p>
            ) : projectQuery.isError ? (
                <p className="mt-3 text-rose-600">
                    Failed to open @{slug}'s project: {projectQuery.error.message}
                </p>
            ) : projectQuery.data ? (
                <>
                    <h2 className="mt-3 font-[var(--serif)] text-3xl text-[var(--foreground)]">
                        {projectQuery.data.title}
                    </h2>
                    <div className="mt-3 flex flex-wrap gap-2">
                        <Badge className="rounded-full">{projectQuery.data.status}</Badge>
                        <Badge className="rounded-full">{projectQuery.data.policyMode}</Badge>
                        <Badge className="rounded-full">{projectQuery.data.fileCount} files</Badge>
                        <Badge className="rounded-full">
                            {projectQuery.data.folderCount} folders
                        </Badge>
                        <Badge className="rounded-full">
                            {formatFileSize(projectQuery.data.totalSize)}
                        </Badge>
                    </div>
                    <p className="mt-6 whitespace-pre-wrap text-base leading-7 text-[var(--foreground)]">
                        {projectQuery.data.description || "Project description is still empty."}
                    </p>
                    <ProjectFileTree
                        mode="reader"
                        projectId={projectQuery.data.id}
                        rootNodeId={projectQuery.data.rootNodeId}
                        slug={slug}
                    />
                </>
            ) : null}
        </section>
    )
}
