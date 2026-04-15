import type { CreateProjectInput } from "@contracts/types/content"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

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

export function useAuthorProjectQuery(slug: string, projectId: string) {
    return useQuery({
        queryKey: queryKeys.authorProject(slug, projectId),
        queryFn: () => projectsApi.getAuthorProject(slug, projectId),
        enabled: Boolean(slug) && Boolean(projectId),
    })
}

export function useCreateMyProjectMutation() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (input: CreateProjectInput) => projectsApi.createMyProject(input),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: queryKeys.myProjects })
            void queryClient.invalidateQueries({ queryKey: ["authors"] })
        },
    })
}
