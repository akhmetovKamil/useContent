import { useQuery } from "@tanstack/react-query"

import { authorsApi } from "@/api/AuthorsApi"
import { projectsApi } from "@/api/ProjectsApi"
import { queryKeys } from "./queryKeys"

export function useMyProjectsQuery(enabled = true) {
    return useQuery({
        queryKey: queryKeys.myProjects,
        queryFn: () => projectsApi.listMyProjects(),
        enabled,
    })
}

export function useAuthorProjectsQuery(slug: string) {
    return useQuery({
        queryKey: queryKeys.authorProjects(slug),
        queryFn: () => authorsApi.listAuthorProjects(slug),
        enabled: Boolean(slug),
    })
}
