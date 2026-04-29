import { ProjectCard, type ProjectItem } from "@/components/projects/ProjectCard"

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
