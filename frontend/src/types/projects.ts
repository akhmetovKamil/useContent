export type ProjectTreeMode = "author" | "reader"

export interface ProjectFileTreeProps {
    mode: ProjectTreeMode
    projectId: string
    rootNodeId: string
    rootLabel?: string
    slug?: string
}
