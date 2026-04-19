import type { FeedProjectDto, ProjectDto } from "@contracts/types/content"
import { FileText, FolderKanban, HardDrive, LockKeyhole } from "lucide-react"
import { Link } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type ProjectItem = ProjectDto | FeedProjectDto

interface ProjectListProps {
    emptyLabel: string
    projects?: ProjectItem[]
    showAuthor?: boolean
}

export function ProjectList({ emptyLabel, projects = [], showAuthor = false }: ProjectListProps) {
    if (!projects.length) {
        return <p className="text-sm text-[var(--muted)]">{emptyLabel}</p>
    }

    return (
        <div className="grid gap-4 md:grid-cols-2">
            {projects.map((project) => (
                <ProjectCard key={project.id} project={project} showAuthor={showAuthor} />
            ))}
        </div>
    )
}

function ProjectCard({ project, showAuthor }: { project: ProjectItem; showAuthor: boolean }) {
    const author = "authorSlug" in project ? project : null
    const hasAccess = !("hasAccess" in project) || project.hasAccess
    const projectLink = author ? `/authors/${author.authorSlug}/projects/${project.id}` : undefined

    return (
        <Card className="rounded-[28px] transition-colors hover:bg-[var(--accent-soft)]">
            <CardHeader className="gap-3">
                {showAuthor && author ? (
                    <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--muted)]">
                        <span>{author.authorDisplayName}</span>
                        <Link
                            className="font-mono underline-offset-4 hover:underline"
                            to={`/authors/${author.authorSlug}`}
                        >
                            @{author.authorSlug}
                        </Link>
                    </div>
                ) : null}
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <FolderKanban className="size-5 text-[var(--muted)]" />
                            {projectLink ? (
                                <Link
                                    className="underline-offset-4 hover:underline"
                                    to={projectLink}
                                >
                                    {project.title}
                                </Link>
                            ) : (
                                project.title
                            )}
                        </CardTitle>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            <Badge className="rounded-full">{project.status}</Badge>
                            <Badge className="rounded-full">
                                <FileText className="size-3.5" />
                                {project.fileCount} files
                            </Badge>
                            <Badge className="rounded-full">
                                <HardDrive className="size-3.5" />
                                {formatFileSize(project.totalSize)}
                            </Badge>
                            {"accessLabel" in project && project.accessLabel ? (
                                <Badge
                                    className="rounded-full"
                                    variant={project.hasAccess ? "success" : "warning"}
                                >
                                    {project.accessLabel}
                                </Badge>
                            ) : null}
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {hasAccess ? (
                    <p className="line-clamp-4 text-sm leading-6 text-[var(--muted)]">
                        {project.description || "Project description is still empty."}
                    </p>
                ) : (
                    <div className="flex flex-col gap-2 rounded-[22px] border border-dashed border-[var(--line)] bg-[var(--surface)] p-4 text-sm text-[var(--muted)] sm:flex-row sm:items-center">
                        <LockKeyhole className="size-4 shrink-0 text-[var(--foreground)]" />
                        <span>
                            This project belongs to{" "}
                            <span className="font-medium text-[var(--foreground)]">
                                {"accessLabel" in project ? project.accessLabel : "a locked tier"}
                            </span>
                            . Subscribe or satisfy the access conditions to open it.
                        </span>
                    </div>
                )}
            </CardContent>
        </Card>
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
